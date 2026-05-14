require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const compression = require('compression');
const { apiLimiter } = require('./middleware/rateLimiter');
const routes     = require('./routes');
const logger     = require('./utils/logger');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── SEGURANÇA ──────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── PARSING ────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// ── LOGGING ────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) }
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
