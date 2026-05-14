const supabase = require('../../config/supabase');
const { success, error } = require('../utils/response');

const ClinicController = {
  async getContext(req, res) {
    return success(res, req.clinic);
  },

  async updateContext(req, res) {
    try {
      const { data, error: err } = await supabase
        .from('clinics')
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq('id', req.clinicId)
        .select()
        .single();
      if (err) return error(res, 'Erro ao atualizar configurações.', 500);
      return success(res, data);
    } catch (e) {
      return error(res, 'Erro ao salvar configurações.', 500);
    }
  },

  async getCampaigns(req, res) {
    try {
      const { data, error: err } = await supabase
        .from('campaigns')
        .select('id, topic, campaign_name, slogan, status, created_at')
        .eq('clinic_id', req.clinicId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (err) return error(res, 'Erro ao buscar campanhas.', 500);
      return success(res, data || []);
    } catch (e) {
      return error(res, 'Erro ao buscar campanhas.', 500);
    }
  },

  async getCampaign(req, res) {
    try {
      const { data, error: err } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', req.params.id)
        .eq('clinic_id', req.clinicId)
        .single();
      if (err || !data) return error(res, 'Campanha não encontrada.', 404);
      return success(res, data);
    } catch (e) {
      return error(res, 'Erro ao buscar campanha.', 500);
    }
  }
};

module.exports = ClinicController;
