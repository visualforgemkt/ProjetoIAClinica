/**
 * MedAI Pro — AI Gateway
 *
 * Camada intermediária que abstrai os providers de IA.
 * O resto do sistema não conhece Anthropic ou OpenAI —
 * apenas chama gateway.complete(options).
 *
 * Providers suportados:
 *   - anthropic (padrão)
 *   - openai    (fallback)
 *
 * Para adicionar novo provider: criar classe que extends BaseProvider
 * e registrar em PROVIDERS.
 */

const Anthropic = require('@anthropic-ai/sdk');
const OpenAI    = require('openai');
const logger    = require('../utils/logger');

// ── Base Provider (interface) ──────────────────────────────────
class BaseProvider {
  async complete({ messages, systemPrompt, maxTokens, model }) {
    throw new Error('complete() must be implemented');
  }
}

// ── Anthropic Provider ─────────────────────────────────────────
class AnthropicProvider extends BaseProvider {
  constructor() {
    super();
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY não configurada');
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.defaultModel = process.env.AI_DEFAULT_MODEL || 'claude-haiku-4-5-20251001';
  }

  async complete({ messages, systemPrompt, maxTokens = 2048, model }) {
    const response = await this.client.messages.create({
      model: model || this.defaultModel,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages
    });

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();

    return {
      text,
      tokens: {
        input:  response.usage?.input_tokens  || 0,
        output: response.usage?.output_tokens || 0,
        total:  (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
      },
      model: response.model,
      provider: 'anthropic'
    };
  }
}

// ── OpenAI Provider ────────────────────────────────────────────
class OpenAIProvider extends BaseProvider {
  constructor() {
    super();
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurada');
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.defaultModel = 'gpt-4o-mini';
  }

  async complete({ messages, systemPrompt, maxTokens = 2048, model }) {
    const response = await this.client.chat.completions.create({
      model: model || this.defaultModel,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    });

    const text = response.choices[0]?.message?.content?.trim() || '';

    return {
      text,
      tokens: {
        input:  response.usage?.prompt_tokens     || 0,
        output: response.usage?.completion_tokens || 0,
        total:  response.usage?.total_tokens      || 0
      },
      model: response.model,
      provider: 'openai'
    };
  }

  async generateImage({ prompt, model = "dall-e-3", size = '1024x1024', quality = 'standard' }) {
    const response = await this.client.images.generate({
      model,
      prompt,
      n: 1,
      size,
      quality: model === 'dall-e-3' ? quality : undefined
    });
    return response.data[0].url;
  }
}

// ── Registry ───────────────────────────────────────────────────
const providerInstances = {};

function getProvider(name) {
  const key = name || process.env.AI_DEFAULT_PROVIDER || 'anthropic';
  if (!providerInstances[key]) {
    if      (key === 'anthropic') providerInstances[key] = new AnthropicProvider();
    else if (key === 'openai')    providerInstances[key] = new OpenAIProvider();
    else throw new Error(`Provider desconhecido: ${key}`);
  }
  return providerInstances[key];
}

// ── Gateway principal ──────────────────────────────────────────
const AIGateway = {
  /**
   * Executa uma chamada de IA com fallback automático
   */
  async complete(options) {
    const {
      messages,
      systemPrompt,
      maxTokens  = parseInt(process.env.AI_MAX_TOKENS) || 4096,
      model      = null,
      provider   = process.env.AI_DEFAULT_PROVIDER || 'anthropic',
      timeout    = parseInt(process.env.AI_TIMEOUT_MS) || 60000,
      clinicId   = null
    } = options;

    const t0 = Date.now();
    logger.info('AI Gateway request', { provider, clinicId, messageCount: messages.length });

    // Timeout wrapper
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI_TIMEOUT')), timeout)
    );

    try {
      const p = getProvider(provider);
      const result = await Promise.race([
        p.complete({ messages, systemPrompt, maxTokens, model }),
        timeoutPromise
      ]);

      const duration = Date.now() - t0;
      logger.info('AI Gateway success', {
        provider: result.provider,
        model: result.model,
        tokens: result.tokens.total,
        duration,
        clinicId
      });

      return { ...result, duration };

    } catch (err) {
      const duration = Date.now() - t0;

      // Fallback para OpenAI se Anthropic falhar ou der Timeout (e OpenAI estiver configurado)
      if (provider === 'anthropic' && process.env.OPENAI_API_KEY) {
        logger.warn('Anthropic failed or timed out, trying OpenAI fallback', { error: err.message, clinicId });
        try {
          const fallback = getProvider('openai');
          const result = await fallback.complete({ messages, systemPrompt, maxTokens });
          return { ...result, duration: Date.now() - t0, fallback: true };
        } catch (fallbackErr) {
          logger.error('OpenAI fallback also failed', { error: fallbackErr.message });
        }
      }

      // Mapear erros conhecidos
      if (err.message === 'AI_TIMEOUT') {
        throw { code: 'AI_TIMEOUT', message: 'Tempo limite excedido. Tente novamente.' };
      }
      if (err.status === 429) {
        throw { code: 'AI_RATE_LIMIT', message: 'Limite de requisições do provider atingido.' };
      }
      if (err.status === 401 || err.status === 403) {
        throw { code: 'AI_AUTH_ERROR', message: 'Erro de autenticação com o provider de IA.' };
      }

      logger.error('AI Gateway error', { 
        error: err.message, 
        duration, 
        clinicId,
        stack: err.stack,
        originalError: err.response?.data || err 
      });
      throw { code: 'AI_ERROR', message: `Erro na IA: ${err.message || 'Erro desconhecido'}` };
    }
  },

  /**
   * P0 — IMAGE GENERATION (DALL-E 3)
   */
  async generateImage(options) {
    const { prompt, clinicId } = options;
    try {
      const p = getProvider('openai');
      if (!p.generateImage) throw new Error('Provider não suporta geração de imagem');
      
      logger.info('AI Image Generation request', { clinicId });
      try {
        return await p.generateImage({ prompt, model: "dall-e-3" });
      } catch (e3) {
        if (e3.message.includes('does not exist') || e3.message.includes('billing')) {
          logger.warn('DALL-E 3 unavailable, trying DALL-E 2', { error: e3.message });
          return await p.generateImage({ prompt, model: "dall-e-2", size: '512x512' });
        }
        throw e3;
      }
    } catch (err) {
      logger.error('AI Image Generation error', { error: err.message, clinicId });
      return null; // Fallback handled by orchestrator
    }
  }
};

module.exports = AIGateway;
