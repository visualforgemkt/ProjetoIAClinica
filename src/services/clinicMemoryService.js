const supabase = require('../../config/supabase');
const logger = require('../utils/logger');

class ClinicMemoryService {
  /**
   * Recupera a memória persistente da clínica
   */
  static async getMemory(clinicId) {
    try {
      const { data, error } = await supabase
        .from('clinic_memory')
        .select('*')
        .eq('clinic_id', clinicId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is not found
        logger.error('Failed to get clinic memory', { error: error.message, clinicId });
      }
      return data || this.getDefaultMemory();
    } catch (err) {
      return this.getDefaultMemory();
    }
  }

  static getDefaultMemory() {
    return {
      identity: { nome: '', especialidade: '', cidade: '', servicos: [], tom: '', diferenciais: [] },
      preferences: { plataformas: [], formatos: [], tamanho: 'medium', temas: [] },
      behavior: { campanhas_aceitas: 0, campanhas_rejeitadas: 0, horarios_uso: [] }
    };
  }

  /**
   * Atualiza a memória da clínica com base em novas informações
   */
  static async updateMemory(clinicId, updates) {
    const memory = await this.getMemory(clinicId);
    
    // Deep merge das atualizações
    const updatedMemory = {
      ...memory,
      identity: { ...memory.identity, ...(updates.identity || {}) },
      preferences: { ...memory.preferences, ...(updates.preferences || {}) },
      behavior: { ...memory.behavior, ...(updates.behavior || {}) }
    };

    try {
      const { error } = await supabase
        .from('clinic_memory')
        .upsert({ clinic_id: clinicId, ...updatedMemory, updated_at: new Date().toISOString() });

      if (error) {
        logger.error('Failed to update clinic memory', { error: error.message, clinicId });
      }
    } catch (err) {
      logger.error('Error updating clinic memory', { error: err.message });
    }
  }

  /**
   * P0 — Motor de Aprendizado (Learning Engine)
   * Aprende progressivamente com o comportamento do usuário (Feedbacks)
   */
  static async learnFromInteraction(clinicId, event) {
    const memory = await this.getMemory(clinicId);
    const updates = { preferences: { ...memory.preferences }, behavior: { ...memory.behavior } };
    
    // Se o usuário rejeita conteúdos muito longos
    if (event.action === 'REJECTED' && event.reason === 'too_long') {
      updates.preferences.tamanho = 'short';
    }

    // Se o usuário aprova, fortalece os tópicos e plataformas
    if (event.action === 'ACCEPTED') {
      updates.behavior.campanhas_aceitas += 1;
      
      const topic = event.topic;
      if (topic) {
        if (!updates.preferences.temas) updates.preferences.temas = [];
        if (!updates.preferences.temas.includes(topic)) {
          updates.preferences.temas.push(topic);
        }
      }
      
      const platform = event.platform;
      if (platform) {
        if (!updates.preferences.plataformas) updates.preferences.plataformas = [];
        if (!updates.preferences.plataformas.includes(platform)) {
          updates.preferences.plataformas.push(platform);
        }
        
        // Exemplo: Detecta preferência por Instagram
        if (updates.preferences.plataformas.filter(p => p === 'instagram').length > 3) {
          updates.preferences.preferredPlatform = 'instagram';
        }
      }
    }

    if (event.action === 'REJECTED') {
      updates.behavior.campanhas_rejeitadas += 1;
    }

    await this.updateMemory(clinicId, updates);
  }
}

module.exports = ClinicMemoryService;
