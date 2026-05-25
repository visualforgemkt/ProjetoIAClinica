-- ═══════════════════════════════════════════════════════════════
-- MedAI Pro — Clinic Memory (Aprendizado Progressivo)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS clinic_memory (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id    UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  identity     JSONB DEFAULT '{}'::jsonb,
  preferences  JSONB DEFAULT '{}'::jsonb,
  behavior     JSONB DEFAULT '{}'::jsonb,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id)
);

CREATE INDEX IF NOT EXISTS idx_clinic_memory_clinic_id ON clinic_memory(clinic_id);
