/**
 * MedAI Pro — AI Orchestrator
 *
 * Arquitetura em camadas:
 *
 *   IntentLayer   → classifica intenção do usuário
 *   ContextLayer  → monta contexto da clínica do banco
 *   PromptLayer   → enriquece prompts com contexto
 *   AgentLayer    → seleciona e executa o agente correto
 *   OutputLayer   → estrutura e valida a resposta
 */

const AIGateway   = require('./gateway');
const agentPrompts = require('./agentPrompts');
const logger      = require('../utils/logger');
const AIParser    = require('./parser');
const ContextLayer = require('./prompts/context/clinicContext');
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
    return 'campaign'; // default mais completo
  }
}

// ── Prompt Layer ───────────────────────────────────────────────
class PromptLayer {
  static enrich(baseSystem, clinic) {
    return baseSystem + ContextLayer.build(clinic);
  }
}

// ── Agent Layer ────────────────────────────────────────────────
class AgentLayer {
  static async executeChat(intent, messages, clinic) {
    const agentMap = {
      campaign: 'orchestrator',
      social:   'instagram',
      faq:      'duvidas',
      health:   'orientacao'
    };
    const agentId  = agentMap[intent] || 'orchestrator';
    const baseSystem = agentPrompts[agentId] || agentPrompts.orientacao;
    const systemPrompt = PromptLayer.enrich(baseSystem, clinic);
    return await AIGateway.complete({ messages, systemPrompt, clinicId: clinic?.id });
  }

  static async executeCampaign(topic, clinic) {
    const systemPrompt = buildCampaignSystem(clinic, topic);
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
  static generate(prompt, style = 'neutral') {
    if (!prompt) return null;
    const seed = Math.floor(Math.random() * 1000000);
    const fullPrompt = style !== 'neutral' ? `${prompt}, style: ${style}` : prompt;
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
      const stylePt = {
        cartoon: 'Desenho Animado', anime: 'Anime', '3d': '3D', pixel_art: 'Pixel Art',
        watercolor: 'Aquarela', digital_painting: 'Pintura Digital', cyberpunk: 'Cyberpunk',
        minimalist: 'Minimalista', futurist: 'Futurista', vintage: 'Vintage',
        realistic_photo: 'Foto Realista', documentary_photo: 'Foto Documental',
        product_photo: 'Foto de Produto', poster: 'Pôster', infographic: 'Infográfico',
        neutral: 'Padrão'
      }[data.style] || data.style || 'Padrão';

      return [
        `### 🎨 Imagem Gerada: ${subject}`,
        `**Estilo:** ${stylePt}`,
        '',
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
          '### 🎨 Sugestão Visual',
          `![Visual](${data.briefingVisual.imageUrl})`,
          `*Conceito: ${data.briefingVisual.conceito || ''}*`,
          ''
        );
      }

      parts.push('---', '*Os detalhes completos e o calendário de postagens foram salvos na sua área de campanhas.*');
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
    const resolvedIntent = intent === 'auto'
      ? IntentLayer.classify(message)
      : intent;

    logger.info('Orchestrator processing', {
      intent: resolvedIntent,
      clinicId: clinic?.id,
      messageLength: message.length
    });

    // 2. Context Layer — clínica já vem do req.clinic (carregada pelo middleware)

    // 3. Agent Layer + Output Layer
    let result;

    if (resolvedIntent === 'campaign') {
      const aiResult = await AgentLayer.executeCampaign(message, clinic);
      result = OutputLayer.parseCampaign(aiResult.text);
      
      // Gerar imagem para o briefing visual se houver prompt
      if (result.type === 'campaign' && result.data?.briefingVisual?.promptImagem) {
        result.data.briefingVisual.imageUrl = ImageUrlGenerator.generate(
          result.data.briefingVisual.promptImagem,
          result.data.briefingVisual.estilo || 'poster'
        );
      }

      result.tokens  = aiResult.tokens;
      result.model   = aiResult.model;
      result.provider = aiResult.provider;

    } else if (resolvedIntent === 'image') {
      // VIE: primeiro interpreta, depois retorna prompt para Pollinations
      const vieResult = await AgentLayer.executeVIE(message, clinic);
      const parsed    = OutputLayer.parseVIE(vieResult.text);
      
      const imageUrl = ImageUrlGenerator.generate(
        parsed?.contentPrompt || message,
        parsed?.style || 'neutral'
      );

      result = {
        type: 'image',
        data: {
          ...(parsed || { subject: message, contentPrompt: message, style: 'neutral', userSpecifiedStyle: false, extraNegatives: '' }),
          imageUrl
        },
        tokens:   vieResult.tokens,
        model:    vieResult.model,
        provider: vieResult.provider
      };

    } else {
      const messages = [
        ...conversationHistory,
        { role: 'user', content: message }
      ];
      const aiResult = await AgentLayer.executeChat(resolvedIntent, messages, clinic);
      result = {
        type:     'text',
        data:     aiResult.text,
        tokens:   aiResult.tokens,
        model:    aiResult.model,
        provider: aiResult.provider
      };
    }

    // 4. Formatting Layer
    result.formattedText = ResponseFormatter.toMarkdown(result.type, result.data);

    result.intent   = resolvedIntent;
    result.duration = Date.now() - t0;
    return result;
  },

  // Exportar camadas para uso direto se necessário
  IntentLayer,
  ContextLayer,
  PromptLayer
};

module.exports = AIOrchestrator;
