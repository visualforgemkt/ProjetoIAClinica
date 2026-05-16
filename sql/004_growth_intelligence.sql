-- FASE 6: GROWTH + PRODUCT INTELLIGENCE + CLIENT VALUE ENGINE
-- Script de Criação das Tabelas de Inteligência e Analytics

-- 1. Onboarding Inteligente (Perfis de Clínica Estendidos)
CREATE TABLE IF NOT EXISTS onboarding_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    goals JSONB NOT NULL DEFAULT '{}', -- ex: {"primary": "aquisicao", "secondary": "fidelizacao"}
    audience JSONB NOT NULL DEFAULT '{}', -- ex: {"age": "25-45", "gender": "majority_female"}
    preferred_tone VARCHAR(50) DEFAULT 'Profissional e Acolhedor',
    specialties TEXT[],
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic_id)
);

-- 2. AI Insights (Insights Gerados Automaticamente)
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- ex: 'CONTENT_PERFORMANCE', 'OPPORTUNITY', 'WARNING'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    actionable_metric JSONB, -- ex: {"metric": "vaccine_posts", "increase": "34%"}
    suggested_action TEXT, -- ex: "Crie uma nova campanha sobre vacinação pediátrica."
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Banco de Recomendações (Sazonais e Estratégicas)
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE, -- NULL se for global
    type VARCHAR(50) NOT NULL, -- ex: 'CAMPAIGN_IDEA', 'SEASONAL_TOPIC'
    title VARCHAR(255) NOT NULL,
    context TEXT, -- ex: "Novembro Azul se aproximando."
    action_prompt TEXT NOT NULL, -- Prompt pronto para o usuário dar 1 clique e rodar
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, DISMISSED, USED
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Product Analytics (Telemetria Granular)
CREATE TABLE IF NOT EXISTS product_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- ex: 'CAMPAIGN_GENERATED', 'LOGIN', 'ABANDONMENT'
    event_data JSONB DEFAULT '{}', -- ex: {"campaign_topic": "Pediatria", "generation_time_ms": 4500}
    session_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Métricas Agregadas (Para Smart Dashboard e Client Success)
CREATE TABLE IF NOT EXISTS clinic_metrics (
    clinic_id UUID PRIMARY KEY REFERENCES clinics(id) ON DELETE CASCADE,
    total_campaigns INT DEFAULT 0,
    total_images INT DEFAULT 0,
    total_ai_interactions INT DEFAULT 0,
    last_active_date TIMESTAMPTZ,
    health_score INT DEFAULT 100, -- 0-100 (baixo = risco de churn)
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atualização automática do updated_at na clinic_metrics
CREATE OR REPLACE FUNCTION trigger_set_timestamp_metrics()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_metrics
BEFORE UPDATE ON clinic_metrics
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp_metrics();

-- Índices de performance para Analytics
CREATE INDEX idx_product_events_type ON product_events(event_type);
CREATE INDEX idx_product_events_clinic ON product_events(clinic_id, created_at);
CREATE INDEX idx_ai_insights_clinic ON ai_insights(clinic_id, created_at DESC);
CREATE INDEX idx_recommendations_clinic ON recommendations(clinic_id, status);
