const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Rate limit geral da API
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    logger.warn('Rate limit hit', { ip: req.ip });
    res.status(429).json({ success: false, error: 'Muitas requisições. Aguarde e tente novamente.', code: 'RATE_LIMIT' });
  }
});

// Rate limit específico para chamadas de IA (mais restritivo)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.AI_RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.clinicId || req.ip,
  handler: (req, res) => {
    logger.warn('AI rate limit hit', { clinicId: req.clinicId });
    res.status(429).json({ success: false, error: 'Limite de requisições de IA atingido. Aguarde 1 minuto.', code: 'AI_RATE_LIMIT' });
  }
});

// Rate limit para login — proteção anti-brute-force
// 10 tentativas por IP a cada 15 minutos
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (req.body?.email || '').toLowerCase().trim();
    return `${req.ip}_${email}`;
  },
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    const email = (req.body?.email || '').toLowerCase().trim();
    logger.warn('Auth rate limit hit — possible brute force', { ip: req.ip, email, path: req.path });
    res.status(429).json({
      success: false,
      error: 'Muitas tentativas de login. Aguarde 15 minutos.',
      code: 'AUTH_RATE_LIMIT'
    });
  }
});

// Rate limit para verificação de código — ainda mais restritivo
// 5 tentativas por IP a cada 5 minutos
const codeVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: parseInt(process.env.CODE_RATE_LIMIT_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    logger.warn('Code verify rate limit hit — possible brute force', { ip: req.ip, emailKey: req.body?.emailKey });
    res.status(429).json({
      success: false,
      error: 'Muitas tentativas. Aguarde 5 minutos.',
      code: 'CODE_RATE_LIMIT'
    });
  }
});

module.exports = { apiLimiter, aiLimiter, authLimiter, codeVerifyLimiter };
