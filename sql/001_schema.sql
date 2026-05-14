-- ═══════════════════════════════════════════════════════════════
-- MedAI Pro — Schema PostgreSQL (Supabase)
-- Multi-tenant, isolamento por clinic_id em todas as tabelas
-- ═══════════════════════════════════════════════════════════════

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- PLANOS (referência)
-- ─────────────────────────────────────────
CREATE TABLE plans (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,                    -- 'starter', 'professional', 'enterprise'
  display_name  TEXT NOT NULL,
  monthly_limit INT  NOT NULL DEFAULT 500,        -- mensagens/mês
  price_brl     NUMERIC(10,2) NOT NULL DEFAULT 0,
  features      JSONB NOT NULL DEFAULT '{}',
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO plans (name, display_name, monthly_limit, price_brl, features) VALUES
  ('starter',      'Starter',      200,  0.00,   '{"campaigns":true,"social":true,"images":true,"faq":true}'),
  ('professional', 'Professional', 500,  99.00,  '{"campaigns":true,"social":true,"images":true,"faq":true,"analytics":true}'),
  ('enterprise',   'Enterprise',   2000, 299.00, '{"campaigns":true,"social":true,"images":true,"faq":true,"analytics":true,"white_label":true}');

-- ─────────────────────────────────────────
-- CLÍNICAS (tenants)
-- ─────────────────────────────────────────
CREATE TABLE clinics (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,             -- URL-safe identifier
  specialty     TEXT,
  city          TEXT,
  target_public TEXT,
  services      TEXT,
  differentials TEXT,
  instagram     TEXT,
  contact       TEXT,
  website       TEXT,
  -- Brand identity
  tone          TEXT DEFAULT 'acolhedor e profissional',
  visual_style  TEXT DEFAULT 'moderno e clean',
  brand_color1  TEXT DEFAULT '#3B7FFF',
  brand_color2  TEXT DEFAULT '#C9A84C',
  logo_url      TEXT,
  -- Plano e limites
  plan_id       UUID REFERENCES plans(id),
  monthly_limit INT  NOT NULL DEFAULT 500,
  -- Status
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  trial_ends_at TIMESTAMPTZ,
  -- Metadata
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- USUÁRIOS
-- ─────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  access_code   TEXT NOT NULL,                    -- 2ª etapa do login
  name          TEXT NOT NULL,
  initials      TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',    -- 'admin', 'editor', 'viewer'
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- SESSÕES / REFRESH TOKENS
-- ─────────────────────────────────────────
CREATE TABLE sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  refresh_token TEXT UNIQUE NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- CONVERSAS (memória da IA)
-- ─────────────────────────────────────────
CREATE TABLE conversations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  intent        TEXT,                             -- 'campaign', 'social', 'image', 'faq', 'health'
  title         TEXT,                             -- resumo gerado pela IA
  message_count INT  DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- MENSAGENS (histórico completo)
-- ─────────────────────────────────────────
CREATE TABLE messages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  clinic_id        UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content          TEXT NOT NULL,
  intent           TEXT,
  image_url        TEXT,
  prompt_used      TEXT,
  tokens_used      INT  DEFAULT 0,
  provider         TEXT DEFAULT 'anthropic',      -- 'anthropic', 'openai', 'demo'
  model            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- CAMPANHAS GERADAS
-- ─────────────────────────────────────────
CREATE TABLE campaigns (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  topic         TEXT NOT NULL,
  campaign_name TEXT,
  slogan        TEXT,
  content       JSONB NOT NULL DEFAULT '{}',      -- estrutura completa da campanha
  status        TEXT DEFAULT 'draft',             -- 'draft', 'published', 'archived'
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- LOGS DE USO (billing + analytics)
-- ─────────────────────────────────────────
CREATE TABLE usage_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id),
  intent        TEXT,                             -- tipo de ação
  agent_id      TEXT,                             -- agente interno usado
  tokens_input  INT  DEFAULT 0,
  tokens_output INT  DEFAULT 0,
  tokens_total  INT  DEFAULT 0,
  provider      TEXT DEFAULT 'anthropic',
  model         TEXT,
  status        TEXT NOT NULL,                    -- 'success', 'error', 'limit_exceeded'
  duration_ms   INT  DEFAULT 0,
  cost_usd      NUMERIC(10,6) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- RATE LIMITING
-- ─────────────────────────────────────────
CREATE TABLE rate_limits (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  window_start  TIMESTAMPTZ NOT NULL,
  request_count INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ÍNDICES
-- ─────────────────────────────────────────
CREATE INDEX idx_users_clinic    ON users(clinic_id);
CREATE INDEX idx_users_email     ON users(email);
CREATE INDEX idx_sessions_user   ON sessions(user_id);
CREATE INDEX idx_sessions_token  ON sessions(refresh_token);
CREATE INDEX idx_conv_clinic     ON conversations(clinic_id);
CREATE INDEX idx_conv_user       ON conversations(user_id);
CREATE INDEX idx_msg_conv        ON messages(conversation_id);
CREATE INDEX idx_msg_clinic      ON messages(clinic_id);
CREATE INDEX idx_camp_clinic     ON campaigns(clinic_id);
CREATE INDEX idx_usage_clinic    ON usage_logs(clinic_id);
CREATE INDEX idx_usage_created   ON usage_logs(created_at);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY (isolamento multi-tenant)
-- ─────────────────────────────────────────
ALTER TABLE clinics         ENABLE ROW LEVEL SECURITY;
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns       ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs      ENABLE ROW LEVEL SECURITY;

-- Políticas: cada clinic só acessa seus próprios dados
-- (O backend usa service_role key que bypassa RLS — RLS é proteção extra)
CREATE POLICY "clinic_isolation_users"    ON users          USING (clinic_id = current_setting('app.clinic_id')::UUID);
CREATE POLICY "clinic_isolation_conv"     ON conversations  USING (clinic_id = current_setting('app.clinic_id')::UUID);
CREATE POLICY "clinic_isolation_msg"      ON messages       USING (clinic_id = current_setting('app.clinic_id')::UUID);
CREATE POLICY "clinic_isolation_camp"     ON campaigns      USING (clinic_id = current_setting('app.clinic_id')::UUID);
CREATE POLICY "clinic_isolation_usage"    ON usage_logs     USING (clinic_id = current_setting('app.clinic_id')::UUID);

-- ─────────────────────────────────────────
-- FUNÇÃO: updated_at automático
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clinics_updated     BEFORE UPDATE ON clinics       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated       BEFORE UPDATE ON users         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_conv_updated        BEFORE UPDATE ON conversations  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_campaigns_updated   BEFORE UPDATE ON campaigns      FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────
-- SEED: clínica demo (Dr. Grégori)
-- ─────────────────────────────────────────
INSERT INTO clinics (id, name, slug, specialty, city, tone, visual_style, plan_id, monthly_limit, onboarding_complete)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Clínica Pediátrica Bertagnolli',
  'clinica-bertagnolli',
  'Pediatria',
  'Porto Alegre, RS',
  'acolhedor e profissional',
  'moderno e clean',
  (SELECT id FROM plans WHERE name = 'professional'),
  500,
  true
);

-- Senha: MedAI@2025! | bcrypt hash (cost 12)
INSERT INTO users (clinic_id, email, password_hash, access_code, name, initials, role)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'doutorgregory@clinica.com.br',
  '$2b$12$PLACEHOLDER_HASH_REPLACE_WITH_REAL_BCRYPT',  -- rodar: node -e "require('bcrypt').hash('MedAI@2025!',12,(_,h)=>console.log(h))"
  'BERG-7X4K',
  'Dr. Grégori Bertagnolli',
  'GB',
  'admin'
);
