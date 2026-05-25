const supabase = require('../../config/supabase');
const logger = require('../utils/logger');
const ClinicMemoryService = require('./clinicMemoryService');

class RecommendationEngine {
  /**
   * P1 — Motor de Recomendação Proativa
   * Avalia a memória da clínica e sugere oportunidades estrategicamente
   */
  static async generateProactiveRecommendations(clinicId) {
    const memory = await ClinicMemoryService.getMemory(clinicId);
    const recommendations = [];

    // 1. Oportunidades por Plataforma/Formato
    const platforms = memory.preferences?.plataformas || [];
    if (platforms.includes('instagram') && !platforms.includes('stories')) {
      recommendations.push({
        type: 'PLATFORM_OPPORTUNITY',
        message: 'Notamos que você usa muito Instagram Feed e pouco Stories. Que tal uma campanha interativa de enquete para os Stories?'
      });
    }

    // 2. Campanhas Sazonais Automáticas
    const currentMonth = new Date().getMonth(); // 0-11
    if (currentMonth === 9) { // Outubro
       recommendations.push({
         type: 'SEASONAL',
         message: 'Outubro Rosa começou. Sugerimos ativar uma campanha de conscientização agora mesmo.'
       });
    } else if (currentMonth === 10) { // Novembro
       recommendations.push({
         type: 'SEASONAL',
         message: 'Novembro Azul está próximo. Deseja que a IA prepare uma campanha preventiva?'
       });
    }

    // 3. Ajustes de Comportamento (Feedback)
    const aceitas = memory.behavior?.campanhas_aceitas || 0;
    const rejeitadas = memory.behavior?.campanhas_rejeitadas || 0;
    
    if (rejeitadas > aceitas && rejeitadas > 2) {
      recommendations.push({
        type: 'ADJUSTMENT',
        message: 'Notei que as últimas campanhas não agradaram tanto. Que tal ajustarmos seu "Tom de Comunicação" nas configurações da clínica?'
      });
    }

    // 4. Detecção de picos temáticos
    const temas = memory.preferences?.temas || [];
    if (temas.includes('vacinação')) {
      recommendations.push({
        type: 'TRENDING_TOPIC',
        message: 'Detectamos aumento do seu interesse em campanhas sobre vacinação. Criar uma série de posts tira-dúvidas?'
      });
    }

    return recommendations;
  }
}

module.exports = RecommendationEngine;
