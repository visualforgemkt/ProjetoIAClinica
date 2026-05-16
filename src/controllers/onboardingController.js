const supabase = require('../../config/supabase');
const eventBus = require('../core/eventBus');
const { EventType } = require('../services/trackingService');
const AIOrchestrator = require('../ai/orchestrator');
const logger = require('../utils/logger');

const OnboardingController = {
  /**
   * P0 — ONBOARDING REAL (WOW MOMENT)
   * Recebe os passos do formulário e já devolve a primeira campanha mágica
   */
  async completeOnboarding(req, res) {
    try {
      const { clinicId } = req.clinic;
      const { goals, specialty, audience, tone, instagram } = req.body;

      // 1. Atualizar o contexto da clínica
      await supabase.from('clinics').update({
        specialty,
        target_public: audience,
        tone,
        instagram
      }).eq('id', clinicId);

      // 2. Gravar o perfil estendido (Fase 6)
      await supabase.from('onboarding_profiles').upsert({
        clinic_id: clinicId,
        goals,
        preferred_tone: tone,
        completed_at: new Date().toISOString()
      });

      // 3. Tracking de sucesso
      eventBus.emitEvent(EventType.ONBOARDING_END, {
        clinicId,
        userId: req.user.id,
        module: 'ONBOARDING',
        screen: 'WizardStep6'
      });

      // 4. THE WOW MOMENT: Gerar a 1ª Campanha automaticamente!
      const topic = 'Apresentação da Clínica e Boas-vindas';
      const aiResponse = await AIOrchestrator.process({
        message: `Crie nossa primeira campanha sobre: ${topic}`,
        intent: 'campaign',
        clinic: { id: clinicId, name: req.clinic.name, specialty, tone }
      });

      res.status(200).json({
        message: 'Onboarding concluído com sucesso!',
        wow_campaign: aiResponse.data // Entrega imediata de valor
      });

    } catch (error) {
      logger.error('Error in completeOnboarding', { error: error.message });
      res.status(500).json({ error: 'Falha ao concluir onboarding' });
    }
  }
};

module.exports = OnboardingController;
