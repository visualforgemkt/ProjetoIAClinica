const AIService  = require('../services/aiService');
const UsageRepository = require('../repositories/usageRepository');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

const AIController = {
  async chat(req, res) {
    try {
      const result = await AIService.chat({
        message:        req.body.message,
        conversationId: req.body.conversationId,
        intent:         req.body.intent || 'auto',
        user:           req.user,
        clinic:         req.clinic
      });
      // DISCLAIMER DE IA (CRÍTICO) - Compliance MedAI Pro
      result.disclaimer = "A MedAI Pro utiliza inteligência artificial para geração de conteúdo e apoio operacional. Os conteúdos gerados devem ser revisados pelo usuário antes de publicação ou utilização. A plataforma não fornece diagnóstico, prescrição ou orientação clínica individual.";
      return success(res, result);
    } catch (e) {
      if (e.code === 'LIMIT_EXCEEDED') {
        return error(res, e.message, 429, 'LIMIT_EXCEEDED');
      }
      if (e.code === 'AI_TIMEOUT') {
        return error(res, 'Tempo limite excedido. Tente novamente.', 504, 'AI_TIMEOUT');
      }
      logger.error('AI chat error', { error: e.message, clinicId: req.clinicId });
      return error(res, e.message || 'Erro ao processar. Tente novamente.', 500, e.code || 'AI_ERROR');
    }
  },

  async getConversations(req, res) {
    try {
      const data = await AIService.getConversations(req.clinicId);
      return success(res, data);
    } catch (e) {
      return error(res, 'Erro ao buscar conversas.', 500);
    }
  },

  async getMessages(req, res) {
    try {
      const data = await AIService.getMessages(req.params.id, req.clinicId);
      return success(res, data);
    } catch (e) {
      return error(res, 'Erro ao buscar mensagens.', 500);
    }
  },

  async getUsage(req, res) {
    try {
      const log = await UsageRepository.getMonthlyUsage(req.clinicId);
      const count = log.filter(r => r.status !== 'error').length;
      return success(res, {
        count,
        limit: req.clinic.monthly_limit,
        percent: Math.round((count / req.clinic.monthly_limit) * 100),
        log: log.slice(0, 50)
      });
    } catch (e) {
      return error(res, 'Erro ao buscar uso.', 500);
    }
  }
};

module.exports = AIController;
