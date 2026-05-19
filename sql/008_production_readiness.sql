-- ═══════════════════════════════════════════════════════════════
-- MedAI Pro — Production Readiness: Billing, Feedbacks & Onboarding
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- TABELA DE FEEDBACKS DOS PILOTOS (👍 👎)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedbacks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID REFERENCES clinics(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  rating      BOOLEAN NOT NULL, -- TRUE = 👍 (gostou), FALSE = 👎 (não gostou)
  comment     TEXT,             -- Resposta à pergunta "O que faltou?"
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de busca rápida para analítica de feedback
CREATE INDEX IF NOT EXISTS idx_feedbacks_clinic ON feedbacks(clinic_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_rating ON feedbacks(rating);

-- ─────────────────────────────────────────
-- GARANTIR COLUNA ONBOARDING_COMPLETE EM CLINICS
-- ─────────────────────────────────────────
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- ─────────────────────────────────────────
-- GARANTIR ESTRUTURA DE SUBSCRIPTIONS PARA MERCADOPAGO
-- ─────────────────────────────────────────
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_name TEXT;
