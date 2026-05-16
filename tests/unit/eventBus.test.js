const eventBus = require('../../src/core/eventBus');
const { TrackingService, EventType } = require('../../src/services/trackingService');

jest.mock('../../src/services/trackingService', () => {
  return {
    TrackingService: {
      track: jest.fn().mockResolvedValue(true)
    },
    EventType: {
      LOGIN: 'USER_LOGIN',
      CAMPAIGN_CREATE: 'CAMPAIGN_CREATED'
    }
  };
});

describe('MedAIEventBus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    eventBus.retryQueue = [];
  });

  it('deve emitir um evento sem travar o processamento principal (assíncrono)', (done) => {
    eventBus.emitEvent('USER_LOGIN', { clinicId: 'c1', userId: 'u1', module: 'TEST' });
    
    // O emitEvent usa setImmediate, então a chamada real ao EventEmitter 
    // acontecerá no próximo loop de eventos.
    setImmediate(() => {
      expect(TrackingService.track).toHaveBeenCalledWith(
        'c1', 'u1', 'USER_LOGIN', 'TEST', undefined, {}
      );
      done();
    });
  });

  it('deve adicionar na retry queue se a emissão falhar de imediato', (done) => {
    // Força o TrackingService a jogar erro no listener
    TrackingService.track.mockRejectedValueOnce(new Error('Network error'));
    
    eventBus.emitEvent('CAMPAIGN_CREATED', { clinicId: 'c2', userId: 'u2', module: 'TEST' });
    
    setImmediate(() => {
      expect(eventBus.retryQueue.length).toBe(1);
      expect(eventBus.retryQueue[0].eventName).toBe('CAMPAIGN_CREATED');
      done();
    });
  });

  it('deve reprocessar a queue e limpar em caso de sucesso', async () => {
    eventBus._pushToQueue('CAMPAIGN_CREATED', { clinicId: 'c3' });
    expect(eventBus.retryQueue.length).toBe(1);

    await eventBus._processRetryQueue();
    expect(TrackingService.track).toHaveBeenCalled();
    expect(eventBus.retryQueue.length).toBe(0);
  });

  it('deve dropar o evento após 3 retentativas', async () => {
    eventBus.retryQueue.push({ eventName: 'TEST', payload: {}, retries: 3 });
    await eventBus._processRetryQueue();
    expect(TrackingService.track).not.toHaveBeenCalled();
    expect(eventBus.retryQueue.length).toBe(0);
  });
});
