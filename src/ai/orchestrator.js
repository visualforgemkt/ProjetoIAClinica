/**
 * MedAI Pro — AI Orchestrator
 *
 * Arquitetura em camadas atualizada (Assistente Inteligente de Crescimento):
 *
 *   buildContext()      → Carrega dados estáticos da clínica
 *   enrichContext()     → Adiciona regras de negócio e informações de serviços
 *   behavioralContext() → Adiciona o tom da clínica e preferências de formato
 *   memoryContext()     → Injeta o aprendizado persistente (o que aprova/rejeita)
 *   executeAgent()      → Seleciona e executa o agente correto com o super-contexto
 */

const AIGateway   = require('./gateway');
const agentPrompts = require('./agentPrompts');
const logger      = require('../utils/logger');
const AIParser    = require('./parser');
const eventBus    = require('../core/eventBus');
const { EventType } = require('../services/trackingService');
const ClinicMemoryService = require('../services/clinicMemoryService');
const VisualIdentityService = require('../services/visualIdentityService');
const ContextBuilder = require('./prompts/context/clinicContext');
const { buildCampaignSystem } = require('./prompts/templates/campaign');
const { buildVIESystem } = require('./prompts/system/imagePrompt');

// ── Intent Layer ───────────────────────────────────────────────
class IntentLayer {
  static classify(text) {
    const t = text.toLowerCase();
    if (/campanha|marketing|divulgar|promover|awareness/.test(t))             return 'campaign';
    if (/instagram|post|story|stories|feed|reels?|legenda|hashtag|social/.test(t)) return 'social';
    if (/imagem|foto|gerar.*visual|visual.*gerar|ilustração|banner|pôster/.test(t)) return 'image';
    if (/dúvida|agendamento|convênio|horário|funciona|atende|contato/.test(t))  return 'faq';
    if (/paciente|crescimento|mais.*cliente|atrair|conseguir/.test(t))          return 'campaign';
    if (/saúde|pediatria|criança|bebê|vacina|febre|sintoma/.test(t))            return 'health';
    return 'campaign'; // default
  }
}

// ── Contextualization Pipeline ─────────────────────────────────
class PipelineLayer {
  static async buildFullContext(clinic) {
    if (!clinic) return '';

    // 1. buildContext() -> Dados Básicos (Identity)
    const baseContext = ContextBuilder.build(clinic);

    // 2. enrichContext() + memoryContext() + behavioralContext() 
    // Extraídos pelo ClinicMemoryService
    const memory = await ClinicMemoryService.getMemory(clinic?.id);
    
    let enrich = '\n\n[MEMÓRIA E COMPORTAMENTO APRENDIDO]';
    
    if (memory.preferences) {
      enrich += `\n- Plataformas preferidas: ${memory.preferences.plataformas?.join(', ') || 'N/A'}`;
      enrich += `\n- Temas de sucesso: ${memory.preferences.temas?.join(', ') || 'N/A'}`;
      enrich += `\n- Tamanho de conteúdo preferido: ${memory.preferences.tamanho || 'médio'}`;
    }
    
    if (memory.behavior) {
      enrich += `\n- O usuário já rejeitou campanhas focadas em formatos longos se a preferência for curta.`;
    }

    return baseContext + enrich;
  }
}

// ── Agent Layer ────────────────────────────────────────────────
class AgentLayer {
  static async executeChat(intent, messages, clinic, superContext) {
    const agentMap = {
      campaign: 'orchestrator',
      social:   'instagram',
      faq:      'duvidas',
      health:   'orientacao'
    };
    const agentId  = agentMap[intent] || 'orchestrator';
    const baseSystem = agentPrompts[agentId] || agentPrompts.orientacao;
    
    const systemPrompt = baseSystem + '\n' + superContext;
    return await AIGateway.complete({ messages, systemPrompt, clinicId: clinic?.id });
  }

  static async executeCampaign(topic, clinic, superContext) {
    const baseSystem = buildCampaignSystem(clinic, topic);
    const systemPrompt = baseSystem + '\n' + superContext;
    
    return await AIGateway.complete({
      messages: [{ role: 'user', content: `Criar campanha: ${topic}` }],
      systemPrompt,
      maxTokens: 8192,
      clinicId: clinic?.id
    });
  }

  static async executeVIE(description, clinic) {
    const systemPrompt = buildVIESystem(clinic);
    return await AIGateway.complete({
      messages: [{ role: 'user', content: description }],
      systemPrompt,
      maxTokens: 1024,
      clinicId: clinic?.id
    });
  }
}

// ── Image URL Generator ────────────────────────────────────────
class ImageUrlGenerator {
  static async generate(prompt, style = 'neutral', clinicId = null, clinicSpecialty = '') {
    if (!prompt) return null;

    // Enriquecer o prompt visual usando o Visual Identity Engine (P1)
    const enrichedPrompt = await VisualIdentityService.enrichImagePrompt(prompt, clinicId, clinicSpecialty);

    if (process.env.OPENAI_API_KEY) {
      try {
        const url = await AIGateway.generateImage({ 
          prompt: enrichedPrompt, 
          clinicId 
        });
        if (url) return url;
      } catch (err) {
        logger.warn('DALL-E 3 failed, falling back to Pollinations', { error: err.message });
      }
    }

    const seed = Math.floor(Math.random() * 1000000);
    const shortPrompt = enrichedPrompt.split('.').slice(0, 2).join('.') || enrichedPrompt;
    const fullPrompt = style !== 'neutral' ? `${shortPrompt}, style: ${style}` : shortPrompt;
    const encoded = encodeURIComponent(fullPrompt);
    return `https://pollinations.ai/p/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true`;
  }
}

// ── Response Formatter ─────────────────────────────────────────
class ResponseFormatter {
  static toMarkdown(type, data) {
    if (!data) return '';

    if (type === 'image') {
      const subject = data.subject || 'Imagem';
      return [
        `### 🎨 Imagem Gerada: ${subject}`,
        `![${subject}](${data.imageUrl})`,
        ''
      ].join('\n');
    }

    if (type === 'campaign') {
      const parts = [
        `# 🚀 Campanha: ${data.nome || 'Nova Campanha'}`,
        `> **"${data.slogan || ''}"**`,
        '',
        '### 🎯 Estratégia',
        `- **Objetivo:** ${data.estrategia?.objetivo || 'N/A'}`,
        `- **Público:** ${data.estrategia?.publicoAlvo || 'N/A'}`,
        `- **CTA:** ${data.estrategia?.ctaPrincipal || 'N/A'}`,
        '',
        '### 📝 Copy Principal',
        data.copyPrincipal || 'Sem conteúdo.',
        ''
      ];

      if (data.briefingVisual?.imageUrl) {
        parts.push(
          '### 🎨 Sugestão Visual Baseada na Identidade',
          `![Visual](${data.briefingVisual.imageUrl})`,
          `*Conceito: ${data.briefingVisual.conceito || ''}*`,
          ''
        );
      }
      parts.push('---', '*Criado usando aprendizado contínuo sobre sua clínica.*');
      return parts.join('\n');
    }

    return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  }
}

// ── Output Layer ───────────────────────────────────────────────
class OutputLayer {
  static parseCampaign(text) {
    return { type: 'campaign', data: AIParser.parse(text, 'campaign') };
  }

  static parseVIE(text) {
    return AIParser.parse(text, 'image');
  }
}

// ── Orchestrator principal ─────────────────────────────────────
const AIOrchestrator = {
  /**
   * Ponto de entrada único para todas as chamadas de IA
   */
  async process({ message, conversationHistory = [], intent = 'auto', clinic }) {
    const t0 = Date.now();

    // 1. Intent Layer
    const resolvedIntent = intent === 'auto' ? IntentLayer.classify(message) : intent;

    // 2. Novo Contextualization Pipeline (Memory & Behavior)
    const superContext = await PipelineLayer.buildFullContext(clinic);

    let result;

    if (resolvedIntent === 'campaign') {
      const aiResult = await AgentLayer.executeCampaign(message, clinic, superContext);
      try {
        result = OutputLayer.parseCampaign(aiResult.text);
      } catch (err) {
        logger.error('Orchestrator Parsing Failed', { error: err.message, text: aiResult.text });
        result = { type: 'campaign', data: { nome: 'Erro', copyPrincipal: 'Erro na formatação.', _error: true } };
      }
      
      // Gera imagem respeitando o Visual Identity Engine
      if (result.type === 'campaign' && result.data?.briefingVisual?.promptImagem) {
        result.data.briefingVisual.imageUrl = await ImageUrlGenerator.generate(
          result.data.briefingVisual.promptImagem,
          result.data.briefingVisual.estilo || 'poster',
          clinic?.id,
          clinic?.specialty
        );
      }

      result.tokens = aiResult.tokens;
      result.model = aiResult.model;
      result.provider = aiResult.provider;

      eventBus.emitEvent(EventType.CAMPAIGN_CREATE, {
        clinicId: clinic?.id, userId: null, module: 'AI_ORCHESTRATOR', screen: 'CampaignBuilder',
        metadata: { intent: resolvedIntent, tokens: result.tokens, duration: Date.now() - t0 }
      });

    } else if (resolvedIntent === 'image') {
      const vieResult = await AgentLayer.executeVIE(message, clinic);
      const parsed = OutputLayer.parseVIE(vieResult.text);
      
      const imageUrl = await ImageUrlGenerator.generate(
        parsed?.contentPrompt || message,
        parsed?.style || 'neutral',
        clinic?.id,
        clinic?.specialty
      );

      result = {
        type: 'image',
        data: { ...(parsed || { subject: message, style: 'neutral' }), imageUrl },
        tokens: vieResult.tokens, model: vieResult.model, provider: vieResult.provider
      };

      eventBus.emitEvent(EventType.IMAGE_CREATE, {
        clinicId: clinic?.id, userId: null, module: 'AI_ORCHESTRATOR', screen: 'ImageGenerator',
        metadata: { style: result.data.style, tokens: result.tokens }
      });

    } else {
      const messages = [ ...conversationHistory, { role: 'user', content: message } ];
      const aiResult = await AgentLayer.executeChat(resolvedIntent, messages, clinic, superContext);
      
      result = { type: 'text', data: aiResult.text, tokens: aiResult.tokens, model: aiResult.model, provider: aiResult.provider };

      eventBus.emitEvent(resolvedIntent === 'faq' ? EventType.FAQ_USE : EventType.AI_CHAT, {
        clinicId: clinic?.id, userId: null, module: 'AI_ORCHESTRATOR', screen: 'ChatBot',
        metadata: { intent: resolvedIntent }
      });
    }

    result.formattedText = ResponseFormatter.toMarkdown(result.type, result.data);
    result.intent = resolvedIntent;
    result.duration = Date.now() - t0;
    return result;
  },

  IntentLayer,
  PipelineLayer
};

module.exports = AIOrchestrator;
