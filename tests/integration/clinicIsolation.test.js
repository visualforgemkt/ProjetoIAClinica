const request = require('supertest');
const express = require('express');
const { authMiddleware } = require('../../src/middleware/auth');

// Setup app simulado para testar o middleware e isolamento
const app = express();
app.use(express.json());

// Mock de verificação JWT
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((token) => {
    if (token === 'token_clinica_A') return { id: 'userA', clinicId: 'clinic_A' };
    if (token === 'token_clinica_B') return { id: 'userB', clinicId: 'clinic_B' };
    throw new Error('Invalid token');
  })
}));

const supabase = require('../../src/config/supabase');
jest.mock('../../src/config/supabase', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockImplementation(function() {
    // Simula validação de sessão ativa no banco
    return { data: { active: true }, error: null };
  })
}));

app.get('/api/clinic/data', authMiddleware, (req, res) => {
  res.json({ clinic: req.clinicId, data: 'secure data' });
});

describe('Integração - Isolamento Multi-Tenant', () => {
  it('deve injetar o clinicId correto da Clínica A', async () => {
    const res = await request(app)
      .get('/api/clinic/data')
      .set('Authorization', 'Bearer token_clinica_A');
    
    expect(res.status).toBe(200);
    expect(res.body.clinic).toBe('clinic_A');
  });

  it('deve injetar o clinicId correto da Clínica B', async () => {
    const res = await request(app)
      .get('/api/clinic/data')
      .set('Authorization', 'Bearer token_clinica_B');
    
    expect(res.status).toBe(200);
    expect(res.body.clinic).toBe('clinic_B');
  });

  it('deve barrar requisições sem token', async () => {
    const res = await request(app).get('/api/clinic/data');
    expect(res.status).toBe(401);
  });
});
