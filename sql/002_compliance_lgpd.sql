-- ═══════════════════════════════════════════════════════════════
-- MedAI Pro — Compliance & LGPD Schema
-- ═══════════════════════════════════════════════════════════════

-- Tabela de consentimentos (LGPD)
CREATE TABLE IF NOT EXISTS user_consents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL,
  privacy_version TEXT NOT NULL,
  ip_address    TEXT,
  user_agent    TEXT,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_clinic ON user_consents(clinic_id);

-- RLS
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinic_isolation_consents" ON user_consents USING (clinic_id = current_setting('app.clinic_id')::UUID);
