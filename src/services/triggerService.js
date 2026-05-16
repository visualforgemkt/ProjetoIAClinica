const supabase = require('../../config/supabase');
const logger = require('../utils/logger');
const AIOrchestrator = require('../ai/orchestrator');

class TriggerService {
  /**
   * P1 — GATILHOS AUTOMÁTICOS
   * Avalia usuários no funil e dispara mensagens baseadas em contexto
   * (Pode ser rodado via CronJob diário)
   */
  static async evaluateJourneyTriggers() {
    try {
      // 1. Regra: Abandono de Onboarding (Iniciou mas não completou após 1 dia)
      const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: stuckUsers } = await supabase
        .from('user_journeys')
        .select('clinic_id')
        .eq('current_stage', 'REGISTERED')
        .lt('first_login_at', past24h);
      
      if (stuckUsers) {
        for (const u of stuckUsers) {
          await this.createTrigger(
            u.clinic_id, 
            'ONBOARDING_DROP',
            'Configuração Pendente',
            'Sua clínica está a um passo de automatizar o marketing. Finalize o perfil da clínica para liberar a IA.',
            '/onboarding'
          );
        }
      }

      // 2. Regra: Inatividade de 7 dias após Ativação
      const past7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: inactiveUsers } = await supabase
        .from('clinic_metrics')
        .select('clinic_id')
        .lt('last_active_date', past7Days);
      
      if (inactiveUsers) {
        for (const u of inactiveUsers) {
          // Usa a IA para gerar uma sugestão personalizada de retorno
          const aiResponse = await AIOrchestrator.process({
            message: 'Escreva uma notificação curta de push (2 linhas) sugerindo que o médico gere um post sobre prevenção, pois notamos ausência dele na plataforma.',
            intent: 'auto',
            clinic: { id: u.clinic_id }
          });
          
          const msg = aiResponse?.data || 'Sentimos sua ausência. Encontramos campanhas sazonais relevantes para sua clínica. Que tal dar uma olhada?';

          await this.createTrigger(
            u.clinic_id,
            'INACTIVITY_7_DAYS',
            'Oportunidade Sazonal',
            msg,
            '/smart-center'
          );
        }
      }
    } catch (err) {
      logger.error('Error evaluating journey triggers', { error: err.message });
    }
  }

  /**
   * P1 — SMART ACTION CENTER
   * Registra uma notificação no painel de ações da clínica
   */
  static async createTrigger(clinicId, triggerType, title, body, actionUrl) {
    // Evita duplicar o mesmo gatilho ativo para a mesma clínica
    const { data: existing } = await supabase
      .from('smart_triggers')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('trigger_type', triggerType)
      .eq('is_delivered', false)
      .single();
    
    if (existing) return; // Já tem esse alerta pendente

    await supabase.from('smart_triggers').insert({
      clinic_id: clinicId,
      trigger_type: triggerType,
      message_title: title,
      message_body: body,
      action_url: actionUrl
    });
  }

  /**
   * Resgata gatilhos ativos para popular a tela do "Smart Action Center"
   */
  static async getActiveTriggers(clinicId) {
    const { data } = await supabase
      .from('smart_triggers')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_delivered', false)
      .order('created_at', { ascending: false });
    return data || [];
  }
  
  static async markTriggerDelivered(triggerId) {
    await supabase.from('smart_triggers').update({ is_delivered: true, delivered_at: new Date().toISOString() }).eq('id', triggerId);
  }
}

module.exports = TriggerService;
