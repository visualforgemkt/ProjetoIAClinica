-- ═══════════════════════════════════════════════════════════════
-- MedAI Pro — Migração SQL FASE 2: Backend Stability Sprint
-- ═══════════════════════════════════════════════════════════════

-- 1. ADICIONAR COLUNAS DE SEGURANÇA E BLOQUEIO DE OTP NA TABELA USERS
ALTER TABLE users ADD COLUMN IF NOT EXISTS access_code_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS access_code_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lockout_count INT DEFAULT 0;

-- 2. CRIAR ÍNDICE DE SESSÕES EXPIRADAS
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 3. CRIAR FUNÇÃO RPC PARA INCREMENTO ATÔMICO DE CONVERSAS (PREVENÇÃO DE RACE CONDITION)
CREATE OR REPLACE FUNCTION increment_message_count(conversation_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE conversations
  SET message_count = COALESCE(message_count, 0) + 1,
      updated_at = NOW()
  WHERE id = conversation_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CRIAR FUNÇÃO RPC PARA ATUALIZAÇÃO ATÔMICA DE MÉTRICAS DA CLÍNICA (ON CONFLICT DO UPDATE)
CREATE OR REPLACE FUNCTION increment_clinic_metrics(
  p_clinic_id UUID,
  p_event_type TEXT
)
RETURNS VOID AS $$
DECLARE
  v_campaigns INT := 0;
  v_images INT := 0;
  v_ai INT := 0;
  v_health INT := 80;
BEGIN
  -- Definir valores a serem adicionados com base no evento
  IF p_event_type = 'CAMPAIGN_GENERATED' THEN
    v_campaigns := 1;
  ELSIF p_event_type = 'IMAGE_GENERATED' THEN
    v_images := 1;
  ELSIF p_event_type = 'AI_CHAT_INTERACTION' THEN
    v_ai := 1;
  END IF;

  INSERT INTO clinic_metrics (
    clinic_id,
    total_campaigns,
    total_images,
    total_ai_interactions,
    health_score,
    last_active_date
  )
  VALUES (
    p_clinic_id,
    v_campaigns,
    v_images,
    v_ai,
    v_health + (CASE WHEN p_event_type = 'CAMPAIGN_GENERATED' THEN 2 ELSE 0 END),
    NOW()
  )
  ON CONFLICT (clinic_id) DO UPDATE
  SET 
    total_campaigns = clinic_metrics.total_campaigns + v_campaigns,
    total_images = clinic_metrics.total_images + v_images,
    total_ai_interactions = clinic_metrics.total_ai_interactions + v_ai,
    health_score = LEAST(100, clinic_metrics.health_score + (CASE WHEN p_event_type = 'CAMPAIGN_GENERATED' THEN 2 ELSE 0 END)),
    last_active_date = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. LIMPEZA DE SESSÕES EXPIRADAS EM PRODUÇÃO (pg_cron)
-- Habilita o agendamento de cron nativo do PostgreSQL/Supabase a cada 6 horas
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove o job antigo se existir para evitar duplicações
SELECT cron.unschedule('cleanup-expired-sessions') FROM cron.job WHERE jobname = 'cleanup-expired-sessions';

-- Agenda o novo job
SELECT cron.schedule('cleanup-expired-sessions', '0 */6 * * *', $$
  DELETE FROM sessions WHERE expires_at < NOW();
$$);
