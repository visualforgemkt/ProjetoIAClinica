const express = require('express');
const router  = express.Router();

const { authMiddleware }  = require('../middleware/auth');
const { aiLimiter }       = require('../middleware/rateLimiter');
const { validate, schemas } = require('../middleware/validator');

const AuthController   = require('../controllers/authController');
const AIController     = require('../controllers/aiController');
const ClinicController = require('../controllers/clinicController');

// ── AUTH (público) ─────────────────────────────────────────────
router.post('/auth/login',       validate(schemas.login),       AuthController.login);
router.post('/auth/verify',      validate(schemas.verifyCode),  AuthController.verifyCode);
router.post('/auth/refresh',     validate(schemas.refreshToken),AuthController.refresh);
router.post('/auth/logout',      AuthController.logout);

// ── AUTH (protegido) ───────────────────────────────────────────
router.get('/auth/me', authMiddleware, AuthController.me);

// ── AI ─────────────────────────────────────────────────────────
router.post('/ai/chat',
  authMiddleware,
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

// ── HEALTH CHECK (público) ─────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'medai-pro-backend', timestamp: new Date().toISOString() });
});

module.exports = router;
