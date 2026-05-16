const AIOrchestrator = require('../../src/ai/orchestrator');
const AIGateway = require('../../src/ai/gateway');

jest.mock('../../src/ai/gateway', () => ({
  complete: jest.fn()
}));

describe('AIOrchestrator - AI Orchestration & Confidence Validation', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockClinic = {
    id: 'clinic-123',
    name: 'Clínica A',
    specialty: 'Dermatologia'
  };

  it('deve classificar a intenção e executar campaign com parser resiliente', async () => {
    // Simulando retorno da IA
    AIGateway.complete.mockResolvedValueOnce({
      text: `{"nome": "Campanha Inverno", "estrategia": {"objetivo": "A", "publicoAlvo": "B", "abordagem": "C", "ctaPrincipal": "D"}, "copyPrincipal": "Texto copy"}`,
      tokens: { prompt: 10, completion: 50 },
      model: 'claude-3-haiku-20240307',
      provider: 'anthropic'
    });

    const result = await AIOrchestrator.process({
      message: 'Quero uma campanha de inverno',
      intent: 'auto',
      clinic: mockClinic
    });

    expect(result.intent).toBe('campaign');
    expect(result.type).toBe('campaign');
    expect(result.data.nome).toBe('Campanha Inverno');
    expect(result.provider).toBe('anthropic');
    expect(AIGateway.complete).toHaveBeenCalledTimes(1);
  });

  it('deve classificar intent e executar geração de imagem (VIE) corretamente', async () => {
    AIGateway.complete.mockResolvedValueOnce({
      text: `{"subject": "Foto clínica", "contentPrompt": "A modern clinic", "style": "realistic_photo"}`,
      tokens: { prompt: 10, completion: 20 },
      model: 'gpt-4o-mini',
      provider: 'openai'
    });

    const result = await AIOrchestrator.process({
      message: 'Gere uma foto realista da clínica',
      intent: 'auto',
      clinic: mockClinic
    });

    expect(result.intent).toBe('image');
    expect(result.type).toBe('image');
    expect(result.data.subject).toBe('Foto clínica');
    expect(result.data.imageUrl).toContain('pollinations.ai');
  });

  it('deve lidar com fallback de intent genérico como chat', async () => {
    AIGateway.complete.mockResolvedValueOnce({
      text: `Olá, em que posso ajudar?`,
      tokens: { prompt: 5, completion: 10 },
      model: 'gpt-4o-mini',
      provider: 'openai'
    });

    const result = await AIOrchestrator.process({
      message: 'Dúvidas sobre o sistema',
      intent: 'faq',
      clinic: mockClinic
    });

    expect(result.intent).toBe('faq');
    expect(result.type).toBe('text');
    expect(result.data).toBe('Olá, em que posso ajudar?');
  });

  it('deve utilizar as Context e Prompt layers de forma isolada', () => {
    const { ContextLayer, PromptLayer } = AIOrchestrator;
    const ctx = ContextLayer.build(mockClinic);
    expect(ctx).toContain('Clínica: Clínica A');
    expect(ctx).toContain('Especialidade: Dermatologia');

    const prompt = PromptLayer.enrich('Sistema base.', mockClinic);
    expect(prompt).toContain('Sistema base.');
    expect(prompt).toContain('Clínica: Clínica A');
  });
});
