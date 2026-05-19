const client = require('prom-client');
const logger = require('./logger');
const supabase = require('../../config/supabase');

// 1. Coleta automática de métricas do sistema do Node.js
client.collectDefaultMetrics({ prefix: 'medai_' });

// 2. Métrica de Tráfego HTTP (Quantidade de requisições)
const httpRequestsTotal = new client.Counter({
  name: 'medai_http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status']
});

// 3. Métrica de Latência HTTP (Duração das requisições)
const httpRequestDurationSeconds = new client.Histogram({
  name: 'medai_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 3, 5, 10, 30] // Buckets ideais para web APIs
});

// 4. Métrica de Requisições de IA
const aiRequestsTotal = new client.Counter({
  name: 'medai_ai_requests_total',
  help: 'Total number of AI requests processed',
  labelNames: ['intent', 'provider', 'model', 'status']
});

// 5. Métrica de Latência de IA
const aiRequestDurationSeconds = new client.Histogram({
  name: 'medai_ai_request_duration_seconds',
  help: 'Duration of AI requests in seconds',
  labelNames: ['intent', 'provider', 'model', 'status'],
  buckets: [0.5, 1, 2, 5, 10, 20, 45, 90]
});

// 6. Métricas Financeiras e Volumetria de Tokens de IA (Solicitadas pelo Usuário)
const aiTokensInputTotal = new client.Counter({
  name: 'medai_ai_tokens_input_total',
  help: 'Total input tokens consumed by AI services',
  labelNames: ['intent', 'provider', 'model']
});

const aiTokensOutputTotal = new client.Counter({
  name: 'medai_ai_tokens_output_total',
  help: 'Total output tokens consumed by AI services',
  labelNames: ['intent', 'provider', 'model']
});

const aiCostUsdTotal = new client.Counter({
  name: 'medai_ai_cost_usd_total',
  help: 'Total cost in USD computed for AI requests',
  labelNames: ['intent', 'provider', 'model']
});

// 7. Métrica de Clínicas Ativas (Gauge)
const activeClinicsGauge = new client.Gauge({
  name: 'medai_active_clinics',
  help: 'Total number of active clinics in the platform'
});

// Cache em memória de clínicas ativas (5 minutos) para evitar sobrecarga de COUNT
let cachedActiveClinicsCount = 0;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos

async function getActiveClinicsCount() {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_DURATION_MS) {
    return cachedActiveClinicsCount;
  }

  try {
    const { count, error } = await supabase
      .from('clinics')
      .select('id', { count: 'exact', head: true })
      .eq('active', true);

    if (error) {
      logger.error('Failed to count active clinics for Prometheus metrics', { error: error.message });
      return cachedActiveClinicsCount; // Retorna cache antigo em caso de falha no DB
    }

    cachedActiveClinicsCount = count || 0;
    lastFetchTime = now;
  } catch (err) {
    logger.error('Database exception counting active clinics for Prometheus metrics', { error: err.message });
  }

  return cachedActiveClinicsCount;
}

// Middleware global para instrumentação de tráfego HTTP
function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    // Ignorar rotas de infra/observabilidade para manter a clareza analítica
    if (req.path.startsWith('/health') || req.path.startsWith('/metrics') || req.path.startsWith('/favicon.ico')) {
      return;
    }
    
    const duration = (Date.now() - start) / 1000; // converter para segundos
    const route = req.baseUrl + (req.route ? req.route.path : req.path);
    const status = res.statusCode.toString();
    
    httpRequestsTotal.inc({ method: req.method, route, status });
    httpRequestDurationSeconds.observe({ method: req.method, route, status }, duration);
  });
  
  next();
}

module.exports = {
  client,
  httpRequestsTotal,
  httpRequestDurationSeconds,
  aiRequestsTotal,
  aiRequestDurationSeconds,
  aiTokensInputTotal,
  aiTokensOutputTotal,
  aiCostUsdTotal,
  activeClinicsGauge,
  getActiveClinicsCount,
  metricsMiddleware
};
