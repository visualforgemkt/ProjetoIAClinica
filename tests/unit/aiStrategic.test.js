const ClinicMemoryService = require('../../src/services/clinicMemoryService');
const VisualIdentityService = require('../../src/services/visualIdentityService');
const RecommendationEngine = require('../../src/services/recommendationEngine');
const supabase = require('../../config/supabase');

jest.mock('../../config/supabase');
jest.mock('../../src/utils/logger');

describe('MedAI Pro Strategic AI Refactoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ClinicMemoryService', () => {
    it('deve retornar memória padrão se não encontrar no banco', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      });

      const memory = await ClinicMemoryService.getMemory('c-1');
      expect(memory.preferences.tamanho).toBe('medium');
      expect(memory.behavior.campanhas_aceitas).toBe(0);
    });

    it('deve atualizar memória dinamicamente ao receber feedback ACCEPTED', async () => {
      jest.spyOn(ClinicMemoryService, 'getMemory').mockResolvedValue(ClinicMemoryService.getDefaultMemory());
      
      const upsertMock = jest.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ upsert: upsertMock });

      await ClinicMemoryService.learnFromInteraction('c-1', {
        action: 'ACCEPTED',
        topic: 'vacinação',
        platform: 'instagram'
      });

      expect(upsertMock).toHaveBeenCalled();
      const payload = upsertMock.mock.calls[0][0];
      expect(payload.behavior.campanhas_aceitas).toBe(1);
      expect(payload.preferences.temas).toContain('vacinação');
      expect(payload.preferences.plataformas).toContain('instagram');
      
      ClinicMemoryService.getMemory.mockRestore();
    });

    it('deve mudar tamanho de preferência se feedback for REJECTED por ser muito longo', async () => {
      jest.spyOn(ClinicMemoryService, 'getMemory').mockResolvedValue(ClinicMemoryService.getDefaultMemory());
      
      const upsertMock = jest.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ upsert: upsertMock });

      await ClinicMemoryService.learnFromInteraction('c-2', {
        action: 'REJECTED',
        reason: 'too_long'
      });

      expect(upsertMock).toHaveBeenCalled();
      const payload = upsertMock.mock.calls[0][0];
      expect(payload.preferences.tamanho).toBe('short');
      
      ClinicMemoryService.getMemory.mockRestore();
    });
  });

  describe('VisualIdentityService', () => {
    it('deve injetar diretrizes de estilo dinâmicas no prompt da IA', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                colors: ['#00FF00', '#0000FF'],
                style: 'digital_painting',
                visual_tone: 'friendly'
              },
              error: null
            })
          })
        })
      });

      const enriched = await VisualIdentityService.enrichImagePrompt('Desenho de um dentista', 'c-1', 'Odontopediatria');
      expect(enriched).toContain('Color Palette: #00FF00, #0000FF');
      expect(enriched).toContain('amigável');
      expect(enriched).toContain('friendly');
    });
  });

  describe('RecommendationEngine', () => {
    it('deve gerar recomendação sugerindo formato baseado nas preferências vazias de stories', async () => {
      // Forçar mock getMemory
      ClinicMemoryService.getMemory = jest.fn().mockResolvedValue({
        preferences: { plataformas: ['instagram', 'facebook'] },
        behavior: { campanhas_rejeitadas: 0, campanhas_aceitas: 2 }
      });

      const recs = await RecommendationEngine.generateProactiveRecommendations('c-1');
      
      const platformRec = recs.find(r => r.type === 'PLATFORM_OPPORTUNITY');
      expect(platformRec).toBeDefined();
      expect(platformRec.message).toContain('Stories');
    });
  });
});
