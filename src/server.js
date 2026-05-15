require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');
const { apiLimiter } = require('./middleware/rateLimiter');
const routes     = require('./routes');
const logger     = require('./utils/logger');

const app  = express();
const PORT = process.env.PORT || 3001;

// Validação de variáveis obrigatórias na inicialização
const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'ANTHROPIC_API_KEY', 'JWT_SECRET'];
const missingEnv = REQUIRED_ENV.filter(k => !process.env[k]);
if (missingEnv.length > 0) {
  logger.error('FATAL: Variáveis de ambiente obrigatórias ausentes', { missing: missingEnv });
  process.exit(1);
}

// ── SEGURANÇA ──────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", "'unsafe-inline'"], // remover unsafe-inline após migração para bundle
      styleSrc:       ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:        ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:         ["'self'", 'data:', 'https://image.pollinations.ai', 'https://pollinations.ai'],
      connectSrc:     ["'self'"],
      frameSrc:       ["'none'"],
      objectSrc:      ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// ── CORS ────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sem origin (curl, mobile apps, Postman em dev) ou origem 'null' (arquivos locais)
    if (process.env.NODE_ENV !== 'production' && (!origin || origin === 'null')) return callback(null, true);
    if (!origin) return callback(new Error('Origem não permitida'), false);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    logger.warn('CORS blocked origin', { origin });
    return callback(new Error('Origem não autorizada'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

// ── REQUEST ID (rastreabilidade) ────────────────────────────────
app.use((req, _res, next) => {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  next();
});

// ── PARSING ────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// ── LOGGING (sem dados sensíveis no output) ─────────────────────
morgan.token('reqId', (req) => req.requestId);
app.use(morgan(':method :url :status :response-time ms - :reqId', {
  stream: { write: (msg) => logger.info(msg.trim()) },
  skip: (req) => req.path === '/api/health' // não logar health checks
}));

// ── RATE LIMITING GLOBAL ───────────────────────────────────────
app.use('/api', apiLimiter);

// ── ROTAS ──────────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 ────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada.' });
});

// ── ERROR HANDLER GLOBAL ───────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
});

// ── START ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`MedAI Pro Backend running on port ${PORT}`, {
    env: process.env.NODE_ENV,
    port: PORT,
    supabase: !!process.env.SUPABASE_URL,
    anthropic: !!process.env.ANTHROPIC_API_KEY
  });
});

module.exports = app;
