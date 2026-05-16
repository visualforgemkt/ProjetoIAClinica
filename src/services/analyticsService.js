const supabase = require('../../config/supabase');
const logger = require('../utils/logger');

class AnalyticsService {
  /**
   * Registra um evento de produto (Product Analytics)
   */
  static async trackEvent(clinicId, userId, eventType, eventData = {}, sessionId = null) {
    try {
      const { error } = await supabase
        .from('product_events')
        .insert({
          clinic_id: clinicId,
          user_id: userId,
          event_type: eventType,
          event_data: eventData,
          session_id: sessionId
        });
      
      if (error) throw error;
      
      // Assincronamente atualiza métricas na clinic_metrics
      this.updateClinicMetrics(clinicId, eventType).catch(err => 
        logger.error('Failed to update clinic metrics', { error: err.message, clinicId })
      );
      
    } catch (error) {
      logger.error('Product Analytics Tracking Failed', { error: error.message, eventType, clinicId });
    }
  }

  /**
   * Atualiza as métricas agregadas da clínica
   */
  static async updateClinicMetrics(clinicId, eventType) {
    // 1. Garante que a linha existe
    const { data: metrics } = await supabase
      .from('clinic_metrics')
      .select('*')
      .eq('clinic_id', clinicId)
      .single();

    let updates = { last_active_date: new Date().toISOString() };
    
    if (eventType === 'CAMPAIGN_GENERATED') updates.total_campaigns = (metrics?.total_campaigns || 0) + 1;
    if (eventType === 'IMAGE_GENERATED') updates.total_images = (metrics?.total_images || 0) + 1;
    if (eventType === 'AI_CHAT_INTERACTION') updates.total_ai_interactions = (metrics?.total_ai_interactions || 0) + 1;

    // Recalcular Health Score simples (exemplo: atividade aumenta score)
    let healthScore = metrics?.health_score || 80;
    if (updates.total_campaigns) healthScore = Math.min(100, healthScore + 2);
    updates.health_score = healthScore;

    if (!metrics) {
      await supabase.from('clinic_metrics').insert({ clinic_id: clinicId, ...updates });
    } else {
      await supabase.from('clinic_metrics').update(updates).eq('clinic_id', clinicId);
    }
  }

  /**
   * Calcula Métricas Diárias, Semanais e Mensais (DAU, WAU, MAU)
   */
  static async getActiveUsers(timeframeDays = 30) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - timeframeDays);
    
    const { data, error } = await supabase
      .from('product_events')
      .select('user_id')
      .gte('created_at', pastDate.toISOString());

    if (error) throw error;

    // Contagem de usuários únicos
    const uniqueUsers = new Set(data.map(d => d.user_id));
    return uniqueUsers.size;
  }
}

module.exports = AnalyticsService;
