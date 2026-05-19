const BillingService = require('../services/billingService');
const UsageRepository = require('../repositories/usageRepository');
const logger          = require('../utils/logger');
const response        = require('../utils/response');

const billingMiddleware = async (req, res, next) => {
  try {
    const clinicId = req.clinic?.id || req.user?.clinic_id;
    if (!clinicId) {
      return response.badRequest(res, 'Clínica não vinculada ao usuário.');
    }

    // Carrega status completo do faturamento e limites da clínica
    const billing = await BillingService.getSubscriptionDetails(clinicId);

    // Injeta os dados da assinatura na requisição para controllers usarem se necessário
    req.billing = billing;

    // Regra 1: Se for rota administrativa (onboarding, perfil /auth/me, consentimento, config de clínica, faturamento), permite se for admin
    const isAdmin = req.user?.role === 'admin';
    const isAuthMe = req.path === '/auth/me';
    const isClinicContext = req.path === '/clinic/context';
    const isConsent = req.path === '/user/consent';
    const isBilling = req.path.startsWith('/billing') || req.path.startsWith('/api/billing');

    if (isAuthMe || isClinicContext || isConsent || isBilling) {
      if (isAdmin) {
        // Mantém acesso administrativo completo mesmo com assinatura inativa/expirada!
        return next();
      }
    }

    // Regra 2: Se a clínica não tem plano ativo (Trial expirado E nenhuma assinatura válida)
    if (!billing.isPremiumActive) {
      logger.warn('Recurso premium bloqueado por falta de assinatura ativa', { clinicId });
      return res.status(402).json({
        success: false,
        code: 'BILLING_REQUIRED',
        error: 'Assinatura MedAI Pro necessária. Regularize seu plano nas configurações.'
      });
    }

    // Regra 3: Limites por plano (Starter = 200, Professional = 500, Enterprise = 2000)
    // Se a rota for de chat/geração (/ai/chat)
    if (req.path === '/ai/chat' || req.path === '/chat') {
      const currentCount = await UsageRepository.getMonthlyCount(clinicId);
      if (currentCount >= billing.monthlyLimit) {
        logger.warn('Uso mensal de IA excedeu o limite do plano contratado', {
          clinicId,
          limit: billing.monthlyLimit,
          current: currentCount
        });
        return res.status(403).json({
          success: false,
          code: 'LIMIT_EXCEEDED',
          error: 'Limite mensal do seu plano foi atingido. Faça upgrade para continuar utilizando o assistente.'
        });
      }
    }

    next();
  } catch (err) {
    logger.error('Erro no middleware de faturamento', { error: err.message });
    return res.status(500).json({ success: false, error: 'Erro interno na validação de faturamento.' });
  }
};

module.exports = billingMiddleware;
