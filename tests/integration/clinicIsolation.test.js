const request = require('supertest');
const express = require('express');
const { authMiddleware } = require('../../src/middleware/auth');

// Setup app simulado para testar o middleware e isolamento
const app = express();
app.use(express.json());

// Mock de verificação JWT
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((token) => {
    if (token === 'token_clinica_A') return { userId: 'userA' };
    if (token === 'token_clinica_B') return { userId: 'userB' };
    throw new Error('Invalid token');
  })
}));

const supabase = require('../../config/supabase');

supabase.eq.mockImplementation((field, value) => {
  supabase._lastVal = value;
  return supabase;
});
supabase.single.mockImplementation(() => {
  const v = supabase._lastVal;
  let cid = v === 'userA' ? 'clinic_A' : v === 'userB' ? 'clinic_B' : v;
  return Promise.resolve({ data: { id: cid, clinic_id: cid, active: true }, error: null });
});

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
