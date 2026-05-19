const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/server');
const supabase = require('../../config/supabase');

jest.mock('../../config/supabase');

describe('🚀 MedAI Pro — Onboarding Unit Suite', () => {
  let userToken, mockUser, mockClinic;

  beforeAll(() => {
    mockClinic = {
      id: 'c-100',
      name: 'Clínica Inicial',
      onboarding_complete: false,
      active: true
    };
    mockUser = {
      id: 'u-100',
      clinic_id: 'c-100',
      email: 'doctor-onboard@test.com',
      role: 'admin',
      name: 'Dr. Onboard',
      active: true
    };

    // Gera token JWT contendo userId para o middleware de autenticação
    userToken = jwt.sign({ userId: mockUser.id, role: mockUser.role }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve rejeitar atualização de contexto se campos obrigatórios faltarem', async () => {
    const res = await request(app)
      .put('/api/clinic/context')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: '' // Nome vazio
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('deve atualizar o contexto clínico e marcar onboarding_complete = true', async () => {
    // Mock do Supabase para authenticação e atualização
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
          single: jest.fn().mockResolvedValue({ data: mockClinic, error: null }),
          update: jest.fn().mockReturnThis(),
          then: jest.fn().mockImplementation(function(callback) {
            return callback({ data: { ...mockClinic, onboarding_complete: true }, error: null });
          })
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null })
      };
    });

    const res = await request(app)
      .put('/api/clinic/context')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Clínica Especializada MedAI',
        specialty: 'Dermatologia',
        city: 'Curitiba - PR',
        target_public: 'Pacientes de estética premium',
        services: 'Botox, preenchimento, consultas de pele',
        differentials: 'Atendimento exclusivo de alta padrão',
        instagram: '@dermatoprem',
        tone: 'Empático e acolhedor',
        onboarding_complete: true
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
