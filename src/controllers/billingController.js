const BillingService = require('../services/billingService');
const logger         = require('../utils/logger');
const response       = require('../utils/response');

const BillingController = {
  /**
   * Obtém status da assinatura e limites atuais da clínica do usuário logado
   */
  async getSubscription(req, res, next) {
    try {
      const clinicId = req.clinic?.id || req.user?.clinic_id;
      if (!clinicId) {
        return response.badRequest(res, 'ID da clínica ausente no token.');
      }

      const details = await BillingService.getSubscriptionDetails(clinicId);
      return response.success(res, details);
    } catch (err) {
      logger.error('Erro ao obter assinatura', { error: err.message });
      next(err);
    }
  },

  /**
   * Cria o link de checkout para assinatura do plano solicitado
   */
  async createCheckout(req, res, next) {
    try {
      const clinicId = req.clinic?.id || req.user?.clinic_id;
      if (!clinicId) {
        return response.badRequest(res, 'ID da clínica ausente no token.');
      }

      const { planName } = req.body;
      if (!planName) {
        return response.badRequest(res, 'Nome do plano obrigatório.');
      }

      const checkoutData = await BillingService.createSubscriptionCheckout(clinicId, planName);
      return response.success(res, checkoutData);
    } catch (err) {
      logger.error('Erro ao criar checkout de faturamento', { error: err.message });
      next(err);
    }
  },

  /**
   * Cancela auto-renovação da assinatura
   */
  async cancelSubscription(req, res, next) {
    try {
      const clinicId = req.clinic?.id || req.user?.clinic_id;
      if (!clinicId) {
        return response.badRequest(res, 'ID da clínica ausente.');
      }

      const result = await BillingService.cancelSubscription(clinicId);
      return response.success(res, result);
    } catch (err) {
      logger.error('Erro ao cancelar assinatura', { error: err.message });
      next(err);
    }
  },

  /**
   * Reativa auto-renovação da assinatura cancelada
   */
  async reactivateSubscription(req, res, next) {
    try {
      const clinicId = req.clinic?.id || req.user?.clinic_id;
      if (!clinicId) {
        return response.badRequest(res, 'ID da clínica ausente.');
      }

      const result = await BillingService.reactivateSubscription(clinicId);
      return response.success(res, result);
    } catch (err) {
      logger.error('Erro ao reativar assinatura', { error: err.message });
      next(err);
    }
  },

  /**
   * Webhook público para receber notificações do MercadoPago
   */
  async webhook(req, res, next) {
    try {
      const payload = req.body;
      const result = await BillingService.processWebhook(payload);
      
      if (!result.success) {
        logger.warn('Falha ao processar webhook de faturamento', { reason: result.reason });
        return res.status(400).json({ success: false, error: result.reason });
      }

      return res.status(200).json({ success: true, message: 'Webhook processado com sucesso.' });
    } catch (err) {
      logger.error('Erro no processamento do webhook', { error: err.message });
      next(err);
    }
  }
};

module.exports = BillingController;
