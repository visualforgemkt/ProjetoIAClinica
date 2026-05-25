const supabase = require('../../config/supabase');
const logger = require('../utils/logger');
const AnalyticsService = require('./analyticsService');

/**
 * Dicionário Oficial de Eventos (Event Taxonomy)
 */
const EventType = {
  LOGIN: 'USER_LOGIN',
  LOGOUT: 'USER_LOGOUT',
  ONBOARDING_START: 'ONBOARDING_STARTED',
  ONBOARDING_END: 'ONBOARDING_COMPLETED',
  CAMPAIGN_CREATE: 'CAMPAIGN_CREATED',
  CAMPAIGN_VIEW: 'CAMPAIGN_VIEWED',
  IMAGE_CREATE: 'IMAGE_GENERATED',
  IG_CONTENT_CREATE: 'IG_CONTENT_CREATED',
  FAQ_USE: 'FAQ_UTILIZED',
  AI_CHAT: 'AI_TRIGGERED',
  SUGGESTION_ACCEPT: 'SUGGESTION_ACCEPTED',
  SUGGESTION_REJECT: 'SUGGESTION_IGNORED',
  FUNNEL_DROP: 'FLOW_ABANDONED'
};

class TrackingService {
  /**
   * P0 — EVENT TRACKING PADRONIZADO
   */
  static async track(clinicId, userId, eventName, module, screen, metadata = {}) {
    const payload = { module, screen, ...metadata };
    
    // 1. Grava o evento bruto no Product Analytics (Criado na Fase 6)
    await AnalyticsService.trackEvent(clinicId, userId, eventName, payload);
    
    // 2. Processa a Jornada e Gatilhos assincronamente (Fase 7)
    this.processJourney(clinicId, eventName, payload).catch(err => {
      logger.error('Error processing user journey', { error: err.message, clinicId });
    });
  }

  /**
   * P1 — FEEDBACK LOOP IA
   * Registra aceites/rejeições de sugestões da IA para treinar o modelo
   */
  static async logAIFeedback(clinicId, userId, interactionType, referenceId, action, notes = '', metadata = {}) {
    try {
      await supabase.from('ai_feedback').insert({
        clinic_id: clinicId,
        user_id: userId,
        interaction_type: interactionType,
        reference_id: referenceId,
        action,
        feedback_notes: notes
      });

      // P0 - O motor de aprendizado usa o feedback para personalizar a IA
      const ClinicMemoryService = require('./clinicMemoryService');
      await ClinicMemoryService.learnFromInteraction(clinicId, {
        action,
        reason: notes, // Exemplo: 'too_long'
        topic: metadata?.topic, // metadata pode precisar ser passada
        platform: metadata?.platform
      });

      // Rastreia como evento genérico também
      await this.track(clinicId, userId, action === 'ACCEPTED' ? EventType.SUGGESTION_ACCEPT : EventType.SUGGESTION_REJECT, 'AI', 'ActionCenter', { referenceId });
    } catch (err) {
      logger.error('Failed to log AI Feedback', { error: err.message, clinicId });
    }
  }

  /**
   * P0 — USER JOURNEY MAPPING & FUNIL
   * Atualiza o estado da clínica no Funil de Conversão dependendo do evento
   */
  static async processJourney(clinicId, eventName, payload) {
    // Busca estado atual
    const { data: journey } = await supabase
      .from('user_journeys')
      .select('*')
      .eq('clinic_id', clinicId)
      .single();

    let updates = { updated_at: new Date().toISOString() };
    const now = updates.updated_at;

    // Lógica do Funil de Conversão
    if (!journey) {
      // Inicia a jornada no primeiro login/cadastro
      if (eventName === EventType.LOGIN || eventName === EventType.ONBOARDING_START) {
        await supabase.from('user_journeys').insert({
          clinic_id: clinicId,
          current_stage: 'REGISTERED',
          first_login_at: now
        });
      }
      return;
    }

    if (eventName === EventType.ONBOARDING_END && !journey.onboarding_completed_at) {
      updates.onboarding_completed_at = now;
      updates.current_stage = 'ONBOARDED';
    } else if (eventName === EventType.CAMPAIGN_CREATE && !journey.first_campaign_at) {
      updates.first_campaign_at = now;
      updates.current_stage = 'ACTIVATED';
    } else if (eventName === EventType.IMAGE_CREATE && !journey.first_image_at) {
      updates.first_image_at = now;
    }

    // Se a clínica já ativou (gerou campanha) e fez várias ações, vira RECURRENT
    if (journey.current_stage === 'ACTIVATED' && eventName === EventType.CAMPAIGN_CREATE) {
      updates.current_stage = 'RECURRENT'; // Promovida a power user
    }

    if (Object.keys(updates).length > 1) {
      await supabase.from('user_journeys').update(updates).eq('clinic_id', clinicId);
    }
  }
}

module.exports = { TrackingService, EventType };
