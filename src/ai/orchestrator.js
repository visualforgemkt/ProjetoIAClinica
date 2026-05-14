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

// ── Context Layer ──────────────────────────────────────────────
class ContextLayer {
  static build(clinic) {
    if (!clinic) return '';
    const parts = [];
    if (clinic.name)          parts.push(`Clínica: ${clinic.name}`);
    if (clinic.specialty)     parts.push(`Especialidade: ${clinic.specialty}`);
    if (clinic.city)          parts.push(`Localização: ${clinic.city}`);
    if (clinic.target_public) parts.push(`Público-alvo: ${clinic.target_public}`);
    if (clinic.services)      parts.push(`Serviços: ${clinic.services}`);
    if (clinic.differentials) parts.push(`Diferenciais: ${clinic.differentials}`);
    if (clinic.tone)          parts.push(`Tom de comunicação: ${clinic.tone}`);
    if (clinic.visual_style)  parts.push(`Estilo visual: ${clinic.visual_style}`);
    if (clinic.instagram)     parts.push(`Instagram: ${clinic.instagram}`);
    if (clinic.contact)       parts.push(`Contato: ${clinic.contact}`);
    if (clinic.brand_color1)  parts.push(`Cor principal: ${clinic.brand_color1}`);
    return parts.length > 0
      ? `\n\n[CONTEXTO DA CLÍNICA — use sempre]\n${parts.join('\n')}`
      : '';
  }
}

// ── Prompt Layer ───────────────────────────────────────────────
class PromptLayer {
  static enrich(baseSystem, clinic) {
    return baseSystem + ContextLayer.build(clinic);
  }

  static buildCampaignSystem(clinic, topic) {
    const ctx    = ContextLayer.build(clinic);
    const nome   = clinic?.name || 'a clínica';
    const esp    = clinic?.specialty || 'médica';
    const seed   = Math.floor(Math.random() * 9000) + 1000;
    const angulos = [
      'EMOCIONAL: histórias reais, amor familiar como motor da ação preventiva',
      'EDUCATIVO: dados, fatos científicos, mitos vs verdades, autoridade médica',
      'PREVENTIVO: antecipação, checklist prático, empoderamento do paciente',
      'AUTORIDADE: posicionamento da clínica, diferenciais, expertise',
      'SAZONAL: urgência do momento atual, por que agir agora'
    ];
    const angulo = angulos[seed % angulos.length];

    const extra  = [
      clinic?.differentials ? `Diferenciais: ${clinic.differentials}.` : '',
      clinic?.instagram     ? `Instagram: ${clinic.instagram}.`         : '',
      clinic?.contact       ? `Contato: ${clinic.contact}.`             : ''
    ].filter(Boolean).join(' ');

    return [
      'Você é uma equipe completa de marketing médico da MedAI Pro: estrategista, copywriter sênior, social media specialist e diretor criativo.',
      ctx,
      '',
      `MISSÃO: Campanha profissional completa sobre "${topic}" para ${nome} (${esp}). ${extra}`,
      '',
      `ÂNGULO CRIATIVO (seed ${seed}): ${angulo}`,
      'Use este ângulo em todo o conteúdo. Garante variação mesmo no mesmo tema.',
      '',
      'REGRA: Responda APENAS com JSON válido. Sem texto antes ou depois.',
      `Conteúdo real, específico para ${nome}. Nunca genérico, nunca placeholder.`,
      '',
      'JSON (português brasileiro):',
      '{',
      '  "nome": "Nome criativo da campanha",',
      '  "slogan": "Slogan forte e memorável",',
      '  "estrategia": {"objetivo":"","publicoAlvo":"","abordagem":"","ctaPrincipal":"","posicionamento":""},',
      '  "copyPrincipal": "Copy completo 5+ parágrafos reais",',
      '  "posts": [{"num":1,"tipo":"Carrossel","titulo":"","legenda":"5+ linhas","slides":["s1","s2","s3"]},{"num":2,"tipo":"Educativo","titulo":"","legenda":"","slides":[]}],',
      '  "stories": [{"num":1,"tipo":"Abertura","conteudo":""},{"num":2,"tipo":"CTA","conteudo":""}],',
      '  "whatsapp": "Mensagem pessoal 4+ linhas",',
      '  "hashtags": ["10","hashtags"],',
      '  "calendario": [{"dia":"Dia 1","acao":"","horario":"","obs":""},{"dia":"Dia 3","acao":"","horario":"","obs":""},{"dia":"Dia 5","acao":"","horario":"","obs":""}],',
      '  "briefingVisual": {"conceito":"Português","composicao":"Português","estilo":"Português","emocao":"Português","cores":"Português","promptImagem":"Prompt em INGLÊS"},',
      '  "versoes": [{"tipo":"emocional","tag":"Emocional","copy":"3+ linhas"},{"tipo":"profissional","tag":"Profissional","copy":"3+ linhas"}],',
      '  "metricas": [{"icone":"👁️","titulo":"Alcance","desc":""},{"icone":"💬","titulo":"Engajamento","desc":""},{"icone":"📅","titulo":"Conversões","desc":""}]',
      '}'
    ].join('\n');
  }

  static buildVIESystem(clinic) {
    const ctx = ContextLayer.build(clinic);
    const styles = 'cartoon|anime|3d|pixel_art|watercolor|digital_painting|cyberpunk|minimalist|futurist|vintage|realistic_photo|documentary_photo|product_photo|poster|infographic|neutral';
    return [
      'Você é um engenheiro de prompts visuais de elite para uma plataforma de IA médica.',
      ctx ? 'Contexto da clínica: ' + ctx : '',
      'Converta o pedido do usuário (em português) em um prompt técnico preciso em INGLÊS (necessário para o gerador).',
      'Separe o CONTEÚDO (o que mostrar) do ESTILO (como renderizar).',
      '',
      `Responda APENAS com JSON válido: {"subject":"<resumo em PORTUGUÊS>","contentPrompt":"<prompt em INGLÊS, sem estilo>","style":"<um destes: ${styles}>","userSpecifiedStyle":<bool>,"extraNegatives":"<negativos em PORTUGUÊS>"}`,
      '',
      'MAPA DE ESTILOS: desenho animado/cartoon→cartoon | anime/mangá→anime | 3d/render→3d | pixel art→pixel_art | aquarela→watercolor | pintura digital→digital_painting | cyberpunk/neon→cyberpunk | minimalista→minimalist | futurista→futurist | vintage/retrô→vintage | foto/realista→realistic_photo | documentário→documentary_photo | produto→product_photo | pôster/cartaz→poster | infográfico→infographic',
      'Regra: subject e extraNegatives devem estar sempre em PORTUGUÊS. contentPrompt sempre em INGLÊS.'
    ].filter(Boolean).join('\n');
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
    const systemPrompt = PromptLayer.buildCampaignSystem(clinic, topic);
    return await AIGateway.complete({
      messages: [{ role: 'user', content: `Criar campanha: ${topic}` }],
      systemPrompt,
      maxTokens: 8192,
      clinicId: clinic?.id
    });
  }

  static async executeVIE(description, clinic) {
    const systemPrompt = PromptLayer.buildVIESystem(clinic);
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
    try {
      const raw   = text.replace(/```json|```/g, '').trim();
      const match = raw.match(/\{[\s\S]*\}/);
      let jsonStr = match ? match[0] : raw;
      
      try {
        const data = JSON.parse(jsonStr);
        return { type: 'campaign', data };
      } catch (e) {
        // Tenta auto-fix para JSON truncado
        if (e.message.includes('Unexpected end') || e.message.includes('Expected')) {
          let fixedStr = jsonStr.replace(/,\s*$/, '');
          const quotes = (fixedStr.match(/(?<!\\)"/g) || []).length;
          if (quotes % 2 !== 0) fixedStr += '"';
          
          const openBraces = (fixedStr.match(/\{/g) || []).length;
          const closeBraces = (fixedStr.match(/\}/g) || []).length;
          const openBrackets = (fixedStr.match(/\[/g) || []).length;
          const closeBrackets = (fixedStr.match(/\]/g) || []).length;
          
          for (let i = 0; i < (openBrackets - closeBrackets); i++) fixedStr += ']';
          for (let i = 0; i < (openBraces - closeBraces); i++) fixedStr += '}';
          
          try {
            return { type: 'campaign', data: JSON.parse(fixedStr) };
          } catch (fixErr) {
            logger.warn('Auto-fix failed, using regex extraction', { error: fixErr.message });
          }
        }
        throw e;
      }
    } catch (e) {
      // Fallback supremo: extração via Regex dos campos principais
      logger.error('Failed to parse campaign JSON, using regex fallback', { error: e.message });
      
      const extract = (regex) => {
        const m = text.match(regex);
        return m ? m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim() : null;
      };

      const partialData = {
        nome:          extract(/"nome":\s*"([^"]+)"/) || 'Campanha (Incompleta)',
        slogan:        extract(/"slogan":\s*"([^"]+)"/) || '',
        copyPrincipal: extract(/"copyPrincipal":\s*"([^"]+)"/) || 'O conteúdo foi cortado pela IA devido ao tamanho. Tente pedir uma campanha mais curta.',
        estrategia: {
          objetivo:    extract(/"objetivo":\s*"([^"]+)"/) || 'N/A'
        }
      };
      
      return { type: 'campaign', data: partialData };
    }
  }

  static parseVIE(text) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON');
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
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
