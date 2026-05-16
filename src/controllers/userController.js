const supabase = require('../../config/supabase');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

const UserController = {
  /**
   * Endpoint LGPD: Salvar consentimento de Termos e Privacidade
   */
  async saveConsent(req, res) {
    try {
      const { termsVersion, privacyVersion } = req.body;
      if (!termsVersion || !privacyVersion) {
        return error(res, 'Versão dos termos e política são obrigatórios.', 400);
      }

      await supabase.from('user_consents').insert({
        user_id: req.user.id,
        clinic_id: req.clinic.id,
        terms_version: termsVersion,
        privacy_version: privacyVersion,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      logger.info('Consentimento LGPD salvo', { userId: req.user.id });
      return success(res, { message: 'Consentimento registrado com sucesso.' });
    } catch (e) {
      logger.error('Erro ao salvar consentimento', { error: e.message });
      return error(res, 'Erro ao registrar consentimento.', 500);
    }
  },

  /**
   * Endpoint LGPD: Exportar todos os dados pessoais do usuário e clínica
   */
  async exportData(req, res) {
    try {
      // Coleta dados do usuário e clínica
      const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();
      const { data: clinic } = await supabase.from('clinics').select('*').eq('id', req.clinic.id).single();
      
      // Coleta histórico do usuário na IA
      const { data: conversations } = await supabase.from('conversations').select('*').eq('user_id', req.user.id);
      
      const exportData = {
        requestDate: new Date().toISOString(),
        user,
        clinic,
        conversations
      };

      logger.info('Exportação de dados LGPD solicitada', { userId: req.user.id });
      return success(res, exportData);
    } catch (e) {
      logger.error('Erro na exportação de dados', { error: e.message });
      return error(res, 'Erro ao processar exportação de dados.', 500);
    }
  },

  /**
   * Endpoint LGPD: Exclusão de conta e anonimização
   */
  async deleteAccount(req, res) {
    try {
      // Anonimizar ou deletar usuário. A exclusão de `users` faz cascade nas outras tabelas
      // Em um ambiente real, podemos fazer um soft delete ou anonimizar.
      await supabase.from('users').delete().eq('id', req.user.id);
      
      logger.info('Conta de usuário excluída via LGPD', { userId: req.user.id });
      return success(res, { message: 'Conta excluída com sucesso. Todos os dados associados foram removidos.' });
    } catch (e) {
      logger.error('Erro ao excluir conta', { error: e.message });
      return error(res, 'Erro ao excluir conta.', 500);
    }
  }
};

module.exports = UserController;
