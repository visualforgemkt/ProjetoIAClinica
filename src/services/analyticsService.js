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
    // Atualiza as métricas da clínica de forma 100% atômica no banco de dados (previne race conditions)
    const { error } = await supabase.rpc('increment_clinic_metrics', { 
      p_clinic_id: clinicId, 
      p_event_type: eventType 
    });

    if (error) {
      logger.error('Failed to atomically update clinic metrics via RPC', { error: error.message, clinicId, eventType });
      throw error;
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
