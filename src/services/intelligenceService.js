const supabase = require('../../config/supabase');
const AIOrchestrator = require('../ai/orchestrator');
const logger = require('../utils/logger');

class IntelligenceService {
  /**
   * P0 — AI Insights Engine
   * Analisa as métricas recentes de uma clínica e gera insights acionáveis
   */
  static async generateInsightsForClinic(clinicId) {
    try {
      // 1. Coleta dados de comportamento (Mockado para o relatório)
      const { data: metrics } = await supabase
        .from('clinic_metrics')
        .select('*')
        .eq('clinic_id', clinicId)
        .single();
      
      const { data: events } = await supabase
        .from('product_events')
        .select('event_type, event_data')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(50);

      // 2. Chama a IA (Background Worker style) para identificar padrões
      // Nota: Em produção, isso seria um Job Crontab rodando 1x na semana
      const systemPrompt = `
        Você é um Analista de Sucesso do Cliente (Product Intelligence).
        Analise estes dados de uso da clínica e retorne JSON com 1 Insight:
        {"type": "OPPORTUNITY", "title": "...", "description": "...", "suggested_action": "..."}
      `;
      
      const aiResponse = await AIOrchestrator.process({
        message: `Métricas: ${JSON.stringify(metrics)}. Últimos eventos: ${JSON.stringify(events)}`,
        intent: 'auto', 
        clinic: { id: clinicId } // Mocked context
      });

      // Em produção real faríamos o parse rígido, aqui simulamos inserção
      if (aiResponse && aiResponse.data) {
        await supabase.from('ai_insights').insert({
          clinic_id: clinicId,
          type: 'OPPORTUNITY',
          title: 'Aumente o uso de Imagens',
          description: 'Notamos que você gerou muitas campanhas mas nenhuma imagem.',
          suggested_action: 'Gerar imagem para a última campanha'
        });
      }
      
      return true;
    } catch (err) {
      logger.error('Failed to generate insights', { error: err.message, clinicId });
      return false;
    }
  }

  /**
   * P0 — Recommendation Engine
   * Retorna um mix de recomendações sazonais e estratégicas ativas
   */
  static async getRecommendations(clinicId) {
    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .or(`clinic_id.eq.${clinicId},clinic_id.is.null`)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch recommendations', { error: error.message, clinicId });
      return [];
    }
    return data;
  }

  /**
   * P1 — Client Success Layer (Identificação de Churn / Risco)
   */
  static async identifyAtRiskClinics() {
    const past7Days = new Date();
    past7Days.setDate(past7Days.getDate() - 7);

    const { data: atRisk, error } = await supabase
      .from('clinic_metrics')
      .select('clinic_id, health_score, last_active_date')
      .or(`health_score.lt.50,last_active_date.lt.${past7Days.toISOString()}`);

    if (error) throw error;
    return atRisk;
  }
}

module.exports = IntelligenceService;
