const winston = require('winston');
const path = require('path');

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    winston.format((info) => {
      // Redact sensitive info
      const sensitiveKeys = ['password', 'password_hash', 'token', 'refreshToken', 'accessCode'];
      const redact = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        for (const key in obj) {
          if (sensitiveKeys.includes(key) && obj[key]) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object') {
            redact(obj[key]);
          }
        }
      };
      redact(info);
      return info;
    })(),
    json()
  ),
  defaultMeta: { service: 'medai-pro' },
  transports: [
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: process.env.LOG_FILE || path.join('logs', 'medai.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10
    })
  ]
});

// Implementação de Error Tracking (Integração Real com Sentry)
if (process.env.SENTRY_DSN) {
  try {
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.APP_ENV || 'production',
      tracesSampleRate: 1.0
    });
    logger.info('Sentry inicializado com sucesso em ambiente de produção');
  } catch (err) {
    logger.warn('Falha ao inicializar SDK do Sentry. Certifique-se de que @sentry/node está instalado.');
  }
}

const globalErrorTracker = (error, req = null) => {
  logger.error('GLOBAL_ERROR_TRACKED', {
    message: error.message,
    stack: error.stack,
    path: req ? req.originalUrl : 'unknown',
    method: req ? req.method : 'unknown',
    body: req ? req.body : null
  });

  if (process.env.SENTRY_DSN) {
    try {
      const Sentry = require('@sentry/node');
      Sentry.captureException(error, {
        extra: {
          path: req ? req.originalUrl : 'unknown',
          method: req ? req.method : 'unknown',
          requestId: req ? req.requestId : 'unknown'
        }
      });
    } catch (_) {
      // Falha silenciosa do tracker
    }
  }
};

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(colorize(), simple())
  }));
}

// Expõe o rastreador global para uso em pontos não tratados da aplicação
logger.globalErrorTracker = globalErrorTracker;

module.exports = logger;
