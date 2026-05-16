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

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(colorize(), simple())
  }));
}

module.exports = logger;
