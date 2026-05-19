const AIOrchestrator   = require('../ai/orchestrator');
const UsageRepository  = require('../repositories/usageRepository');
const supabase         = require('../../config/supabase');
const logger           = require('../utils/logger');
const { 
  aiRequestsTotal, 
  aiRequestDurationSeconds, 
  aiTokensInputTotal, 
  aiTokensOutputTotal, 
  aiCostUsdTotal 
} = require('../utils/metrics');

const AIService = {
  /**
   * Processa mensagem do usuário — ponto de entrada do chat
   */
  async chat({ message, conversationId, intent = 'auto', user, clinic }) {
    // 1. Verificar limite mensal
    const limitCheck = await UsageRepository.checkLimit(clinic.id, clinic.monthly_limit);
    if (limitCheck.exceeded) {
      await UsageRepository.log({
        clinicId: clinic.id, userId: user.id,
        intent, agentId: 'limit_check', status: 'limit_exceeded'
      });
      throw { code: 'LIMIT_EXCEEDED', message: `Limite de ${clinic.monthly_limit} mensagens mensais atingido.` };
    }

    // 2. Carregar histórico da conversa (se conversationId fornecido)
    let conversationHistory = [];
    let convId = conversationId;

    if (convId) {
      const { data: messages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', convId)
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: true })
        .limit(20);
      conversationHistory = messages || [];
    } else {
      // Criar nova conversa
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ clinic_id: clinic.id, user_id: user.id, intent })
        .select()
        .single();
      convId = newConv?.id;
    }

    // 3. Chamar AI Orchestrator
    const t0 = Date.now();
    let aiResult, status = 'success';

    try {
      aiResult = await AIOrchestrator.process({
        message,
        conversationHistory,
        intent,
        clinic
      });
    } catch (e) {
      status = 'error';
      // Registra a métrica de erro do Prometheus
      aiRequestsTotal.inc({ intent, provider: 'unknown', model: 'unknown', status: 'error' });
      await UsageRepository.log({
        clinicId: clinic.id, userId: user.id, intent,
        agentId: intent, status: 'error',
        durationMs: Date.now() - t0
      });
      throw e;
    }

    // Registra métricas de sucesso, duração e custos financeiros no Prometheus (prom-client)
    const durationSec = (Date.now() - t0) / 1000;
    aiRequestsTotal.inc({ intent: aiResult.intent, provider: aiResult.provider, model: aiResult.model, status: 'success' });
    aiRequestDurationSeconds.observe({ intent: aiResult.intent, provider: aiResult.provider, model: aiResult.model, status: 'success' }, durationSec);
    
    aiTokensInputTotal.inc({ intent: aiResult.intent, provider: aiResult.provider, model: aiResult.model }, aiResult.tokens?.input || 0);
    aiTokensOutputTotal.inc({ intent: aiResult.intent, provider: aiResult.provider, model: aiResult.model }, aiResult.tokens?.output || 0);
    aiCostUsdTotal.inc({ intent: aiResult.intent, provider: aiResult.provider, model: aiResult.model }, aiResult.cost || 0);

    // 4. Persistir mensagens
    const userMsg = message;
    
    // Se tiver formattedText (Markdown), usamos ele para o chat, caso contrário o texto original
    const assistantMsg = aiResult.formattedText || aiResult.data;

    // Extrair imageUrl se disponível para persistência direta
    const imageUrl = aiResult.type === 'image' ? aiResult.data?.imageUrl : 
                    (aiResult.type === 'campaign' ? aiResult.data?.briefingVisual?.imageUrl : null);

    await supabase.from('messages').insert([
      { conversation_id: convId, clinic_id: clinic.id, role: 'user',      content: userMsg },
      { 
        conversation_id: convId, 
        clinic_id: clinic.id, 
        role: 'assistant', 
        content: assistantMsg, 
        image_url: imageUrl,
        tokens_used: aiResult.tokens?.total || 0, 
        provider: aiResult.provider, 
        model: aiResult.model 
      }
    ]);

    // Atualizar contagem da conversa de forma atômica no banco de dados (previne race conditions)
    await supabase.rpc('increment_message_count', { conversation_uuid: convId });

    // 5. Persistir campanha se for campaign
    let campaignId = null;
    if (aiResult.type === 'campaign' && aiResult.data) {
      const { data: camp } = await supabase.from('campaigns').insert({
        clinic_id: clinic.id, user_id: user.id,
        conversation_id: convId,
        topic: message,
        campaign_name: aiResult.data.nome,
        slogan: aiResult.data.slogan,
        content: aiResult.data
      }).select().single();
      campaignId = camp?.id;
    }

    // 6. Log de uso
    await UsageRepository.log({
      clinicId:     clinic.id,
      userId:       user.id,
      intent:       aiResult.intent,
      agentId:      aiResult.intent,
      tokensInput:  aiResult.tokens?.input  || 0,
      tokensOutput: aiResult.tokens?.output || 0,
      tokensTotal:  aiResult.tokens?.total  || 0,
      provider:     aiResult.provider,
      model:        aiResult.model,
      status:       'success',
      durationMs:   aiResult.duration
    });

    return {
      type:           aiResult.type,
      data:           aiResult.data,
      intent:         aiResult.intent,
      conversationId: convId,
      campaignId,
      usage: {
        current: limitCheck.count + 1,
        limit:   clinic.monthly_limit,
        percent: Math.round(((limitCheck.count + 1) / clinic.monthly_limit) * 100)
      }
    };
  },

  /**
   * Lista conversas de uma clínica
   */
  async getConversations(clinicId, limit = 20) {
    const { data } = await supabase
      .from('conversations')
      .select('id, intent, title, message_count, created_at, updated_at')
      .eq('clinic_id', clinicId)
      .order('updated_at', { ascending: false })
      .limit(limit);
    return data || [];
  },

  /**
   * Busca mensagens de uma conversa
   */
  async getMessages(conversationId, clinicId) {
    const { data } = await supabase
      .from('messages')
      .select('id, role, content, intent, image_url, tokens_used, created_at')
      .eq('conversation_id', conversationId)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: true });
    return data || [];
  }
};

module.exports = AIService;
