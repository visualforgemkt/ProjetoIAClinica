const express = require('express');
const router  = express.Router();

const { authMiddleware }  = require('../middleware/auth');
const { aiLimiter, authLimiter, codeVerifyLimiter } = require('../middleware/rateLimiter');
const { validate, schemas } = require('../middleware/validator');
const trackingMiddleware = require('../middleware/trackingMiddleware');

const AuthController   = require('../controllers/authController');
const AIController     = require('../controllers/aiController');
const ClinicController = require('../controllers/clinicController');
const UserController   = require('../controllers/userController');
const BillingController = require('../controllers/billingController');

const billingMiddleware = require('../middleware/billingMiddleware');

// Tracking global (Middlewares que monitoram requisições)
router.use(trackingMiddleware);

// ── AUTH (público) ─────────────────────────────────────────────
// authLimiter: 10 tentativas / 15min por IP (anti-brute-force)
// codeVerifyLimiter: 5 tentativas / 5min por IP
router.post('/auth/login',       authLimiter,       validate(schemas.login),        AuthController.login);
router.post('/auth/verify',      codeVerifyLimiter, validate(schemas.verifyCode),   AuthController.verifyCode);
router.post('/auth/refresh',     authLimiter,       validate(schemas.refreshToken), AuthController.refresh);
router.post('/auth/logout',      AuthController.logout);

// ── BILLING WEBHOOK (público) ──────────────────────────────────
router.post('/billing/webhook', BillingController.webhook);

// ── AUTH (protegido) ───────────────────────────────────────────
router.get('/auth/me', authMiddleware, AuthController.me);

// ── BILLING (protegido) ─────────────────────────────────────────
router.get('/billing/subscription',  authMiddleware, BillingController.getSubscription);
router.post('/billing/checkout',     authMiddleware, BillingController.createCheckout);
router.post('/billing/cancel',       authMiddleware, BillingController.cancelSubscription);
router.post('/billing/reactivate',   authMiddleware, BillingController.reactivateSubscription);

// ── AI ─────────────────────────────────────────────────────────
router.post('/ai/chat',
  authMiddleware,
  billingMiddleware,
  aiLimiter,
  validate(schemas.chat),
  AIController.chat
);

router.get('/ai/conversations',          authMiddleware, AIController.getConversations);
router.get('/ai/conversations/:id',      authMiddleware, AIController.getMessages);
router.get('/ai/usage',                  authMiddleware, AIController.getUsage);

// ── CLINIC ─────────────────────────────────────────────────────
router.get('/clinic/context',            authMiddleware, ClinicController.getContext);
router.put('/clinic/context',            authMiddleware, validate(schemas.clinicUpdate), ClinicController.updateContext);
router.get('/clinic/campaigns',          authMiddleware, ClinicController.getCampaigns);
router.get('/clinic/campaigns/:id',      authMiddleware, ClinicController.getCampaign);

// ── USER / LGPD COMPLIANCE ─────────────────────────────────────
router.post('/user/consent',             authMiddleware, UserController.saveConsent);
router.post('/user/feedback',            authMiddleware, UserController.saveFeedback);
router.get('/user/export-data',          authMiddleware, UserController.exportData);
router.delete('/user/delete-account',    authMiddleware, UserController.deleteAccount);

// ── OBSERVABILITY & HEALTH CHECKS ──────────────────────────────
router.get('/health', async (req, res) => {
  // Verificação profunda de banco e mem
  res.json({
    status: 'ok',
    service: 'medai-pro-backend',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

const { client: promClient, getActiveClinicsCount, activeClinicsGauge } = require('../utils/metrics');

router.get('/metrics', async (req, res) => {
  try {
    // Carrega clínicas ativas (com cache de 5 minutos interno)
    const activeCount = await getActiveClinicsCount();
    activeClinicsGauge.set(activeCount);

    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

module.exports = router;
