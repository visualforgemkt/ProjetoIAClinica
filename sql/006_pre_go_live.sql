-- FASE 8 / PRE GO-LIVE: ESTRUTURAS FINAIS DE OPERAÇÃO REAL

-- 1. Tabela de Planos de Assinatura
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(50) PRIMARY KEY, -- 'TRIAL', 'BASIC', 'PRO', 'ENTERPRISE'
    name VARCHAR(100) NOT NULL,
    price_brl DECIMAL(10,2) NOT NULL,
    features JSONB NOT NULL DEFAULT '{}', -- Ex: {"ai_campaigns": 10, "ai_images": 5}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserindo os planos Iniciais (Go-Live)
INSERT INTO subscription_plans (id, name, price_brl, features) VALUES
('TRIAL', 'Teste Gratuito', 0.00, '{"ai_campaigns": 3, "ai_images": 1, "support": "email", "duration_days": 7}'),
('PRO', 'MedAI Pro', 297.00, '{"ai_campaigns": -1, "ai_images": 100, "support": "priority"}')
ON CONFLICT (id) DO NOTHING;

-- 2. Suporte e Central de Chamados (Helpdesk)
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED, CLOSED
    priority VARCHAR(50) DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_clinic ON support_tickets(clinic_id, status);

-- Trigger para atualizar update_at
CREATE TRIGGER set_timestamp_support
BEFORE UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp_metrics();
