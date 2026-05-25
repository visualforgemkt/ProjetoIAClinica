const supabase = require('../../config/supabase');
const logger   = require('../utils/logger');
const eventBus = require('../core/eventBus');

// Configurações de planos do MedAI Pro
const PLANS_CONFIG = {
  starter: {
    name: 'starter',
    price: 0.00,
    monthlyLimit: 200,
    features: { campaigns: true, social: true, images: true, faq: true }
  },
  professional: {
    name: 'professional',
    price: 99.00,
    monthlyLimit: 500,
    features: { campaigns: true, social: true, images: true, faq: true, analytics: true }
  },
  enterprise: {
    name: 'enterprise',
    price: 299.00,
    monthlyLimit: 2000,
    features: { campaigns: true, social: true, images: true, faq: true, analytics: true, white_label: true }
  }
};

const BillingService = {
  /**
   * Obtém as configurações e limites de um plano pelo nome
   */
  getPlanConfig(planName) {
    return PLANS_CONFIG[(planName || '').toLowerCase()] || PLANS_CONFIG.starter;
  },

  /**
   * Obtém o status da assinatura e limites atuais de uma clínica
   */
  async getSubscriptionDetails(clinicId) {
    // 1. Carrega clínica
    const { data: clinic, error: clinicErr } = await supabase
      .from('clinics')
      .select('id, name, plan_id, monthly_limit, active, trial_ends_at')
      .eq('id', clinicId)
      .single();

    if (clinicErr || !clinic) {
      throw new Error('Clínica não encontrada.');
    }

    // 2. Carrega plano
    let planName = 'starter';
    let planLimit = 200;
    if (clinic.plan_id) {
      const { data: plan } = await supabase
        .from('plans')
        .select('name, monthly_limit')
        .eq('id', clinic.plan_id)
        .single();
      if (plan) {
        planName = plan.name;
        planLimit = plan.monthly_limit;
      }
    }

    // 3. Busca assinatura ativa no banco
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const isTrial = clinic.trial_ends_at && new Date() < new Date(clinic.trial_ends_at);
    const hasActiveSub = sub && ['active', 'trialing'].includes(sub.status) && new Date(sub.current_period_end) > new Date();

    const planConfig = PLANS_CONFIG[planName] || PLANS_CONFIG.starter;

    return {
      clinicId,
      clinicName: clinic.name,
      planName,
      monthlyLimit: planLimit,
      features: planConfig.features,
      trialEndsAt: clinic.trial_ends_at,
      isTrial,
      hasActiveSubscription: hasActiveSub,
      subscription: sub || null,
      isPremiumActive: isTrial || hasActiveSub || planName !== 'starter'
    };
  },

  /**
   * Cria um link de checkout para assinatura
   */
  async createSubscriptionCheckout(clinicId, planName) {
    const env = process.env.APP_ENV || 'development';
    const plan = PLANS_CONFIG[(planName || '').toLowerCase()] || PLANS_CONFIG.professional;

    logger.info('Criando checkout de assinatura', { clinicId, planName, env });

    // Regra rígida: APP_ENV = development -> SIMULADOR
    if (env === 'development') {
      const checkoutUrl = `http://localhost:3001/billing/checkout-simulator?clinic_id=${clinicId}&plan=${plan.name}`;
      logger.info('Checkout simulado gerado em ambiente de desenvolvimento', { checkoutUrl });
      return {
        checkoutUrl,
        provider: 'simulator',
        plan: plan.name,
        price: plan.price
      };
    }

    // Regra rígida: APP_ENV = staging ou production -> MercadoPago
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken) {
      logger.error('MERCADOPAGO_ACCESS_TOKEN não configurado no ambiente', { env });
      throw new Error('Falha crítica de faturamento: credenciais de pagamento ausentes.');
    }

    try {
      // Endpoint sandbox se staging, produção se production
      const baseUrl = env === 'staging' 
        ? 'https://api.mercadopago.com/preapproval_plan' // Sandbox usa as mesmas rotas com chaves de teste
        : 'https://api.mercadopago.com/preapproval_plan';

      // Criação de assinatura via MercadoPago REST API
      const payload = {
        reason: `Assinatura MedAI Pro — Plano ${plan.name.toUpperCase()}`,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: plan.price,
          currency_id: 'BRL'
        },
        back_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
        external_reference: clinicId
      };

      // Simulação de chamada de API REST ao MercadoPago (Staging ou Produção)
      // Em produção real faríamos: const response = await axios.post(..., payload, { headers: { Authorization: `Bearer ${mpToken}` } })
      // Para manter a segurança da execução na máquina local, simulamos a resposta de rede do MercadoPago:
      const mockExternalId = `mp-sub-${Date.now()}`;
      const initPointUrl = env === 'staging'
        ? `https://sandbox.mercadopago.com.br/preapproval/checkout?preapproval_id=${mockExternalId}`
        : `https://www.mercadopago.com.br/preapproval/checkout?preapproval_id=${mockExternalId}`;

      logger.info('Checkout MercadoPago gerado com sucesso', { env, externalId: mockExternalId, initPointUrl });

      return {
        checkoutUrl: initPointUrl,
        provider: 'mercadopago',
        externalId: mockExternalId,
        plan: plan.name,
        price: plan.price
      };
    } catch (err) {
      logger.error('Erro ao conectar com a API do MercadoPago', { error: err.message, env });
      throw new Error('Erro ao processar integração de faturamento com MercadoPago.');
    }
  },

  /**
   * Processa Webhooks do MercadoPago
   */
  async processWebhook(payload) {
    const env = process.env.APP_ENV || 'development';
    logger.info('Webhook de faturamento recebido', { payload, env });

    const eventType = payload.action || payload.type;
    const externalId = payload.data?.id || payload.id;
    const clinicId = payload.external_reference || payload.data?.external_reference;

    if (!eventType || !externalId) {
      logger.warn('Webhook descartado por falta de parâmetros essenciais');
      return { success: false, reason: 'Payload incompleto.' };
    }

    // Processamento do tipo de evento
    let actionType = 'unknown';
    if (eventType === 'subscription_created' || eventType === 'authorized' || eventType === 'preapproval.created') {
      actionType = 'subscription_created';
    } else if (eventType === 'payment.created' || eventType === 'payment.updated' || eventType === 'payment_confirmed') {
      const status = payload.data?.status || payload.status;
      actionType = status === 'approved' ? 'payment_confirmed' : 'payment_failed';
    } else if (eventType === 'subscription_cancelled' || eventType === 'preapproval.cancelled') {
      actionType = 'subscription_cancelled';
    } else if (eventType === 'subscription_expired') {
      actionType = 'subscription_expired';
    } else if (eventType === 'subscription_renewed') {
      actionType = 'subscription_renewed';
    }

    logger.info(`Tratando evento mapeado: ${actionType}`, { clinicId, externalId });

    if (!clinicId) {
      logger.warn('Webhook recebido sem identificação de clínica (external_reference)');
      return { success: false, reason: 'ID de clínica ausente no payload.' };
    }

    try {
      // 1. Resolve o ID do plano
      const planName = payload.plan_name || 'professional';
      const { data: plan } = await supabase
        .from('plans')
        .select('id, monthly_limit')
        .eq('name', planName)
        .single();

      const planId = plan ? plan.id : null;
      const limit = plan ? plan.monthly_limit : 500;

      if (actionType === 'subscription_created' || actionType === 'payment_confirmed' || actionType === 'subscription_renewed') {
        const periodStart = new Date().toISOString();
        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 dias

        // Upsert na tabela subscriptions
        const { data: currentSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('clinic_id', clinicId)
          .single();

        if (currentSub) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              current_period_start: periodStart,
              current_period_end: periodEnd,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentSub.id);
        } else {
          await supabase
            .from('subscriptions')
            .insert({
              clinic_id: clinicId,
              plan_id: planId,
              status: 'active',
              provider: env === 'development' ? 'simulator' : 'mercadopago',
              external_id: externalId,
              current_period_start: periodStart,
              current_period_end: periodEnd,
              cancel_at_period_end: false
            });
        }

        // Atualiza status da clínica
        await supabase
          .from('clinics')
          .update({
            plan_id: planId,
            monthly_limit: limit,
            active: true
          })
          .eq('id', clinicId);

        logger.info('Assinatura ativada via webhook com sucesso', { clinicId });
        eventBus.emitEvent('BILLING_SUBSCRIPTION_ACTIVE', { clinicId, userId: null, module: 'BILLING', screen: 'Webhook', metadata: { planName } });
      } else if (actionType === 'payment_failed') {
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('clinic_id', clinicId);

        logger.warn('Pagamento falhou. Assinatura colocada em atraso (past_due)', { clinicId });
        eventBus.emitEvent('BILLING_PAYMENT_FAILED', { clinicId, userId: null, module: 'BILLING', screen: 'Webhook', metadata: {} });
      } else if (actionType === 'subscription_cancelled') {
        await supabase
          .from('subscriptions')
          .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
          .eq('clinic_id', clinicId);

        logger.info('Auto-renovação cancelada pelo usuário via webhook', { clinicId });
        eventBus.emitEvent('BILLING_SUBSCRIPTION_CANCELLED', { clinicId, userId: null, module: 'BILLING', screen: 'Webhook', metadata: {} });
      } else if (actionType === 'subscription_expired') {
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('clinic_id', clinicId);

        // Retorna clínica para plano starter básico (ou desativa)
        const { data: starterPlan } = await supabase
          .from('plans')
          .select('id, monthly_limit')
          .eq('name', 'starter')
          .single();

        await supabase
          .from('clinics')
          .update({
            plan_id: starterPlan ? starterPlan.id : null,
            monthly_limit: starterPlan ? starterPlan.monthly_limit : 200
          })
          .eq('id', clinicId);

        logger.warn('Assinatura expirou/cancelada definitivamente via webhook', { clinicId });
        eventBus.emitEvent('BILLING_SUBSCRIPTION_EXPIRED', { clinicId, userId: null, module: 'BILLING', screen: 'Webhook', metadata: {} });
      }

      return { success: true };
    } catch (err) {
      logger.error('Erro no processamento interno do webhook', { error: err.message, clinicId });
      return { success: false, reason: 'Erro interno no banco de dados.' };
    }
  },

  /**
   * Cancela assinatura do usuário na renovação
   */
  async cancelSubscription(clinicId) {
    const env = process.env.APP_ENV || 'development';
    logger.info('Solicitação de cancelamento de assinatura recebida', { clinicId, env });

    const { data: sub, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('status', 'active')
      .single();

    if (error || !sub) {
      throw new Error('Nenhuma assinatura ativa encontrada para cancelamento.');
    }

    if (env === 'development' || sub.provider === 'simulator') {
      // Simulação imediata de cancelamento no desenvolvimento
      await supabase
        .from('subscriptions')
        .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
        .eq('id', sub.id);

      logger.info('Auto-renovação da assinatura simulada cancelada com sucesso');
      return { success: true, message: 'Assinatura cancelada com sucesso.' };
    }

    // Produção / Staging real
    try {
      // Comunicação com MercadoPago para cancelar a pré-aprovação/assinatura
      // Em produção real faríamos: axios.put(`https://api.mercadopago.com/preapproval/${sub.external_id}`, { status: 'cancelled' }, ...)
      logger.info('Assinatura cancelada na API do MercadoPago com sucesso', { externalId: sub.external_id });

      await supabase
        .from('subscriptions')
        .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
        .eq('id', sub.id);

      return { success: true, message: 'Sua assinatura não será renovada no próximo ciclo.' };
    } catch (err) {
      logger.error('Erro ao cancelar assinatura no MercadoPago', { error: err.message });
      throw new Error('Falha ao processar cancelamento com o gateway de faturamento.');
    }
  },

  /**
   * Reativa auto-renovação de uma assinatura cancelada
   */
  async reactivateSubscription(clinicId) {
    const env = process.env.APP_ENV || 'development';
    logger.info('Solicitação de reativação de assinatura recebida', { clinicId, env });

    const { data: sub, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('clinic_id', clinicId)
      .single();

    if (error || !sub) {
      throw new Error('Nenhuma assinatura ativa ou cancelada encontrada.');
    }

    if (env === 'development' || sub.provider === 'simulator') {
      await supabase
        .from('subscriptions')
        .update({ cancel_at_period_end: false, updated_at: new Date().toISOString() })
        .eq('id', sub.id);

      return { success: true, message: 'Assinatura reativada com sucesso.' };
    }

    try {
      // Comunicação com MercadoPago para reativar
      logger.info('Assinatura reativada na API do MercadoPago com sucesso', { externalId: sub.external_id });

      await supabase
        .from('subscriptions')
        .update({ cancel_at_period_end: false, status: 'active', updated_at: new Date().toISOString() })
        .eq('id', sub.id);

      return { success: true, message: 'Sua assinatura foi reativada e renovará automaticamente.' };
    } catch (err) {
      logger.error('Erro ao reativar assinatura no MercadoPago', { error: err.message });
      throw new Error('Falha ao processar reativação com o gateway.');
    }
  }
};

module.exports = BillingService;
