const EventEmitter = require('events');
const logger = require('../utils/logger');
const { TrackingService } = require('../services/trackingService');

class MedAIEventBus extends EventEmitter {
  constructor() {
    super();
    // Aumenta o limite de listeners para evitar warnings em concorrência alta
    this.setMaxListeners(20);
    this.retryQueue = [];
    
    // Inicia worker em background para reprocessamento
    setInterval(() => this._processRetryQueue(), 60000); // 1 min
  }

  /**
   * P0 — EVENT BUS INTERNO
   * Emite evento de forma assíncrona, desacoplando o fluxo
   */
  emitEvent(eventName, payload) {
    const { clinicId, userId, module, screen, metadata = {} } = payload;

    // Fast return: nunca trava a requisição
    setImmediate(() => {
      const startTime = Date.now();
      try {
        logger.info(`[EventBus] Emitting ${eventName}`, { clinicId, userId, module });
        this.emit(eventName, { clinicId, userId, module, screen, metadata, startTime });
      } catch (err) {
        logger.error(`[EventBus] Emit failed for ${eventName}`, { error: err.message, clinicId });
        this._pushToQueue(eventName, payload);
      }
    });
  }

  /**
   * P1 — EVENT RETRY / FAILSAFE
   */
  _pushToQueue(eventName, payload) {
    if (this.retryQueue.length < 5000) { // Limit queue size to avoid OOM
      this.retryQueue.push({ eventName, payload, retries: 0 });
    } else {
      logger.error('[EventBus] Retry queue full! Dropping event.', { eventName });
    }
  }

  async _processRetryQueue() {
    if (this.retryQueue.length === 0) return;
    
    logger.info(`[EventBus] Processing retry queue: ${this.retryQueue.length} events`);
    const currentQueue = [...this.retryQueue];
    this.retryQueue = [];

    for (const item of currentQueue) {
      if (item.retries >= 3) {
        logger.error('[EventBus] Event dropped after 3 retries', { eventName: item.eventName });
        continue; // Drop permanently
      }
      
      item.retries++;
      try {
        await TrackingService.track(
          item.payload.clinicId,
          item.payload.userId,
          item.eventName,
          item.payload.module,
          item.payload.screen,
          item.payload.metadata
        );
        logger.info(`[EventBus] Event recovered via retry`, { eventName: item.eventName });
      } catch (err) {
        this.retryQueue.push(item);
      }
    }
  }
}

const eventBus = new MedAIEventBus();

// P0 — REGISTRO CENTRALIZADO DE LISTENERS
// Listeners globais conectam o bus aos serviços
const { EventType } = require('../services/trackingService');

Object.values(EventType).forEach(eventName => {
  eventBus.on(eventName, async ({ clinicId, userId, module, screen, metadata, startTime }) => {
    try {
      await TrackingService.track(clinicId, userId, eventName, module, screen, metadata);
      const duration = Date.now() - startTime;
      logger.info(`[EventBus] Processed ${eventName}`, { durationMs: duration, clinicId });
    } catch (err) {
      logger.error(`[EventBus] Processing failed for ${eventName}`, { error: err.message });
      eventBus._pushToQueue(eventName, { clinicId, userId, module, screen, metadata });
    }
  });
});

module.exports = eventBus;
