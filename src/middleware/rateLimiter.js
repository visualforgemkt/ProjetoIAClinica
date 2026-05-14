const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Rate limit geral da API
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.clinicId || req.ip,
  handler: (req, res) => {
    logger.warn('Rate limit hit', { ip: req.ip, clinicId: req.clinicId });
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

module.exports = { apiLimiter, aiLimiter };
