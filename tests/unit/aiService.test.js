const AIService = require('../../src/services/aiService');
const UsageRepository = require('../../src/repositories/usageRepository');
const AIOrchestrator = require('../../src/ai/orchestrator');

jest.mock('../../src/repositories/usageRepository');
jest.mock('../../src/ai/orchestrator');
const supabase = require('../../src/config/supabase');

describe('AIService - IA Orchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve bloquear chamada se limite mensal foi excedido', async () => {
    UsageRepository.checkLimit.mockResolvedValueOnce({ exceeded: true, count: 500 });

    const params = {
      message: 'Crie um post',
      user: { id: 'user-1' },
      clinic: { id: 'clinic-1', monthly_limit: 500 }
    };

    await expect(AIService.chat(params)).rejects.toMatchObject({
      code: 'LIMIT_EXCEEDED'
    });
  });

  it('deve chamar o Orchestrator e retornar fallback em caso de falha', async () => {
    UsageRepository.checkLimit.mockResolvedValueOnce({ exceeded: false, count: 10 });
    
    // Simula mock de DB para criar conversa
    supabase.single.mockResolvedValueOnce({ data: { id: 'conv-1' }, error: null });

    AIOrchestrator.process.mockResolvedValueOnce({
      type: 'text',
      data: 'Resposta fallback segura',
      intent: 'auto',
      tokens: { total: 15 },
      provider: 'fallback',
      model: 'default'
    });

    const params = {
      message: 'Me ajude',
      user: { id: 'user-1' },
      clinic: { id: 'clinic-1', monthly_limit: 500 }
    };

    const result = await AIService.chat(params);

    expect(result.data).toBe('Resposta fallback segura');
    expect(result.provider).toBeUndefined(); // internal return structure
    expect(AIOrchestrator.process).toHaveBeenCalledTimes(1);
    expect(UsageRepository.log).toHaveBeenCalledTimes(1); // Log de uso deve ser salvo
  });
});
