const request = require('supertest');
const app = require('../../src/server'); // Carrega a aplicação Express configurada
const supabase = require('../../config/supabase');
const jwt = require('jsonwebtoken');

// Mock dinâmico do Supabase (já configurado no setup global)
jest.mock('../../config/supabase');

describe('💳 MedAI Pro — Billing Integration Suite', () => {
  let adminToken, editorToken, clinicId, mockUser, mockClinic;

  beforeAll(() => {
    clinicId = 'c-999';
    mockClinic = {
      id: clinicId,
      name: 'Clínica Homologação',
      plan_id: 'p-starter',
      monthly_limit: 200,
      active: true,
      onboarding_complete: true
    };
    mockUser = {
      id: 'u-999',
      clinic_id: clinicId,
      email: 'doctor@test.com',
      role: 'admin',
      name: 'Dr. Teste',
      active: true
    };

    // Gera tokens JWT válidos compatíveis com o authMiddleware (espera userId)
    adminToken = jwt.sign({ userId: mockUser.id, role: mockUser.role }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });
    editorToken = jwt.sign({ userId: 'u-888', role: 'editor' }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('📡 1. Webhook Event Processing (MercadoPago)', () => {
    it('deve processar webhook payment_confirmed e ativar plano', async () => {
      // Mock de fluxo fluido do Supabase
      supabase.from.mockImplementation((table) => {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 'p-prof', name: 'professional', monthly_limit: 500 }, error: null }),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          then: jest.fn().mockImplementation(function(callback) {
            return callback({ data: {}, error: null });
          })
        };
      });

      const res = await request(app)
        .post('/api/billing/webhook')
        .send({
          action: 'payment_confirmed',
          id: 'mp-payment-123',
          external_reference: clinicId,
          plan_name: 'professional',
          data: { status: 'approved', id: 'mp-payment-123' }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('deve processar webhook subscription_expired e rebaixar limites', async () => {
      supabase.from.mockImplementation((table) => {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 'p-starter', name: 'starter', monthly_limit: 200 }, error: null }),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          then: jest.fn().mockImplementation(function(callback) {
            return callback({ data: {}, error: null });
          })
        };
      });

      const res = await request(app)
        .post('/api/billing/webhook')
        .send({
          action: 'subscription_expired',
          id: 'mp-sub-123',
          external_reference: clinicId
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('🛡️ 2. Billing Enforcement Middleware & Limits', () => {
    it('deve permitir acesso administrativo ao admin mesmo se o plano estiver inativo', async () => {
      // Configura clínica com plano inativo e sem trial
      supabase.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
          };
        }
        if (table === 'clinics') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { ...mockClinic, plan_id: null, trial_ends_at: null }, error: null })
          };
        }
        if (table === 'subscriptions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: 'No subscription' })
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: [], error: null }),
          then: jest.fn().mockImplementation(function(callback) {
            return callback({ data: [], error: null });
          })
        };
      });

      // GET /api/clinic/context (Rota administrativa) deve ser permitida para o admin
      const res = await request(app)
        .get('/api/clinic/context')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('deve bloquear chamadas de IA para clínicas com plano inativo/expirado', async () => {
      supabase.from.mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
          };
        }
        if (table === 'clinics') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { ...mockClinic, plan_id: null, trial_ends_at: null }, error: null })
          };
        }
        if (table === 'subscriptions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: 'No subscription' })
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: [], error: null }),
          then: jest.fn().mockImplementation(function(callback) {
            return callback({ data: [], error: null });
          })
        };
      });

      // POST /api/ai/chat (Recurso premium) deve retornar 402 Payment Required
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ message: 'Olá assistente' });

      expect(res.status).toBe(402);
      expect(res.body.code).toBe('BILLING_REQUIRED');
    });
  });
});
