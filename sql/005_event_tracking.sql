-- FASE 7: EVENT TRACKING + USER JOURNEY + FEEDBACK LOOP

-- 1. AI Feedback Loop (Aprendizado Contínuo)
CREATE TABLE IF NOT EXISTS ai_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    interaction_type VARCHAR(50) NOT NULL, -- 'RECOMMENDATION', 'CAMPAIGN_RESULT', 'IMAGE_RESULT'
    reference_id UUID, -- ID da recomendação ou campanha que originou o feedback
    action VARCHAR(50) NOT NULL, -- 'ACCEPTED', 'REJECTED', 'MODIFIED', 'USED'
    feedback_notes TEXT, -- Justificativa opcional (ex: "Tom muito informal")
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Journey States (Mapeamento do Funil)
CREATE TABLE IF NOT EXISTS user_journeys (
    clinic_id UUID PRIMARY KEY REFERENCES clinics(id) ON DELETE CASCADE,
    current_stage VARCHAR(50) DEFAULT 'REGISTERED', -- REGISTERED, ONBOARDED, ACTIVATED, RECURRENT, CHURN_RISK
    first_login_at TIMESTAMPTZ,
    onboarding_completed_at TIMESTAMPTZ,
    first_campaign_at TIMESTAMPTZ,
    first_image_at TIMESTAMPTZ,
    last_milestone_reached VARCHAR(100),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Gatilhos de Ação Inteligente (Smart Action Triggers)
CREATE TABLE IF NOT EXISTS smart_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) NOT NULL, -- 'INACTIVITY_7_DAYS', 'HIGH_ENGAGEMENT_TOPIC', 'ONBOARDING_DROP'
    message_title VARCHAR(255) NOT NULL,
    message_body TEXT NOT NULL,
    action_url VARCHAR(255),
    is_delivered BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_ai_feedback_clinic ON ai_feedback(clinic_id, created_at);
CREATE INDEX idx_user_journeys_stage ON user_journeys(current_stage);
CREATE INDEX idx_smart_triggers_status ON smart_triggers(clinic_id, is_delivered);
