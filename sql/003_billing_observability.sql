-- ═══════════════════════════════════════════════════════════════
-- MedAI Pro — Billing, Monitoramento e Feature Flags
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- BILLING E ASSINATURAS (Preparação SaaS)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  plan_id       UUID NOT NULL REFERENCES plans(id),
  status        TEXT NOT NULL DEFAULT 'active', -- 'active', 'past_due', 'canceled', 'trialing'
  provider      TEXT NOT NULL DEFAULT 'stripe', -- 'stripe', 'mercadopago', 'manual'
  external_id   TEXT, -- Stripe Subscription ID
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end   TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subs_clinic ON subscriptions(clinic_id);

-- ─────────────────────────────────────────
-- FEATURE FLAGS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_flags (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key           TEXT UNIQUE NOT NULL, -- ex: 'new_image_gen', 'whatsapp_integration'
  description   TEXT,
  is_enabled    BOOLEAN DEFAULT FALSE,
  type          TEXT DEFAULT 'global', -- 'global', 'percentage', 'clinic'
  percentage    INT DEFAULT 0, -- 0-100 se type=percentage
  allowed_clinics UUID[] DEFAULT '{}', -- lista de clinics se type=clinic
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ANALYTICS E EVENTOS (Telemetria)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID REFERENCES clinics(id) ON DELETE SET NULL,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  event_name    TEXT NOT NULL, -- ex: 'page_view', 'campaign_generated'
  properties    JSONB DEFAULT '{}',
  session_id    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_name ON events(event_name);
CREATE INDEX idx_events_clinic ON events(clinic_id);

-- ─────────────────────────────────────────
-- EXTENSÃO DE USAGE_LOGS PARA CUSTOS REAIS
-- ─────────────────────────────────────────
-- Adicionamos suporte a cálculo de latência e provider failure
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS fallback_triggered BOOLEAN DEFAULT FALSE;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS latency_ms INT DEFAULT 0;
