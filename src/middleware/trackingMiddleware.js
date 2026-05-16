const logger = require('../utils/logger');
const eventBus = require('../core/eventBus');

/**
 * P0 — MIDDLEWARE DE TRACKING
 * Captura silenciosamente uso de rotas e performance sem travar fluxo
 */
function trackingMiddleware(req, res, next) {
  const start = Date.now();
  
  // Hook na conclusão da resposta para pegar status code
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Filtra rotas de noise
    if (req.path.startsWith('/health') || req.path.startsWith('/metrics')) return;

    const payload = {
      clinicId: req.clinic?.id || null,
      userId: req.user?.id || null,
      module: 'API_ROUTER',
      screen: req.path,
      metadata: {
        method: req.method,
        statusCode: res.statusCode,
        durationMs: duration,
        ip: req.ip
      }
    };

    // Emit event genérico de navegação/visualização de página
    // (Pode ser estendido para emitir eventos específicos dependendo da rota)
    eventBus.emitEvent('ROUTE_VISITED', payload);
  });

  next();
}

module.exports = trackingMiddleware;
