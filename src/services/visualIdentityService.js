const supabase = require('../../config/supabase');
const logger = require('../utils/logger');

class VisualIdentityService {
  /**
   * Retorna a identidade visual persistida da clínica
   */
  static async getIdentity(clinicId) {
    try {
      const { data, error } = await supabase
        .from('visual_identities')
        .select('*')
        .eq('clinic_id', clinicId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Failed to get visual identity', { error: error.message, clinicId });
      }
      return data || this.getDefaultIdentity();
    } catch (err) {
      return this.getDefaultIdentity();
    }
  }

  static getDefaultIdentity() {
    return {
      colors: ['#FFFFFF', '#000000'],
      logo_url: '',
      style: 'minimalist',
      references: [],
      visual_tone: 'professional'
    };
  }

  /**
   * P1 — Motor de Identidade Visual
   * Enriquece o prompt de imagens baseando-se no perfil da clínica
   * Evita imagens genéricas.
   */
  static async enrichImagePrompt(basePrompt, clinicId, especialidade) {
    const identity = await this.getIdentity(clinicId);
    
    let styleText = identity.style;
    
    // Regras automáticas baseadas na especialidade (se o estilo não for super específico)
    if (especialidade) {
      const esp = especialidade.toLowerCase();
      if (esp.includes('infantil') || esp.includes('pediatria')) {
        styleText = 'amigável, colorido, acolhedor';
      } else if (esp.includes('cardio')) {
        styleText = 'profissional, minimalista, azul e branco';
      } else if (esp.includes('odonto')) {
        styleText = 'limpo, brilhante, focado em sorrisos saudáveis';
      }
    }

    const colorPalette = identity.colors && identity.colors.length > 0 ? identity.colors.join(', ') : 'cores neutras';

    return `${basePrompt}. 
    MANDATORY STYLE INSTRUCTIONS: 
    - Color Palette: ${colorPalette}
    - Visual Style: ${styleText}
    - Visual Tone: ${identity.visual_tone}
    Ensure the image strictly follows this clinical brand identity.`;
  }
}

module.exports = VisualIdentityService;
