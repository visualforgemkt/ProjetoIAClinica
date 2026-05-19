const request = require('supertest');
const app = require('../../src/server');
const supabase = require('../../config/supabase');

describe('MedAI Pro — Full System Flow Integration & Bug Audit', () => {
  let accessToken;
  let refreshToken;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Infraestrutura & Saúde (Health Checks)', () => {
    it('deve retornar status OK do sistema', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect(200);

      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('service', 'medai-pro-backend');
    });
  });

  describe('2. Ciclo de Autenticação Completo (Login, OTP & Me)', () => {
    it('deve falhar login com e-mail inexistente', async () => {
      // Mock temporário para retornar erro de não encontrado
      supabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'inexistente@medai.com.br', password: 'senhaValida123' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('E-mail não encontrado.');
    });

    it('deve falhar login com senha incorreta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'doutor@medai.com.br', password: 'senhaErrada123' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Senha incorreta.');
    });

    it('deve passar na etapa 1 (login) com credenciais válidas e disparar OTP', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'doutor@medai.com.br', password: 'senhaValida123' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('emailKey', 'doutor@medai.com.br');
      expect(res.body.data).toHaveProperty('userId', 'u-123');
    });

    it('deve passar na etapa 2 (verificação) com OTP correto e emitir tokens JWT', async () => {
      const res = await request(app)
        .post('/api/auth/verify')
        .send({ emailKey: 'doutor@medai.com.br', accessCode: '987654' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user).toHaveProperty('email', 'doutor@medai.com.br');
      expect(res.body.data.clinic).toHaveProperty('name', 'Clínica MedAI');

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('deve retornar dados do usuário autenticado no endpoint /auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('email', 'doutor@medai.com.br');
    });
  });

  describe('3. Funcionalidades de Negócio & Clínicas', () => {
    it('deve carregar o contexto da clínica', async () => {
      const res = await request(app)
        .get('/api/clinic/context')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('specialty', 'Cardiologia');
    });

    it('deve atualizar o contexto da clínica', async () => {
      const res = await request(app)
        .put('/api/clinic/context')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          specialty: 'Pediatria',
          city: 'Rio de Janeiro',
          tone: 'empatica',
          visual_style: 'modern',
          brand_color1: '#ff0000',
          brand_color2: '#ffffff'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'Clínica MedAI');
    });
  });

  describe('4. Interações de IA (Chat, Conversas & Métricas)', () => {
    it('deve carregar histórico de conversas vazia de forma segura', async () => {
      const res = await request(app)
        .get('/api/ai/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('deve carregar uso de IA da clínica', async () => {
      const res = await request(app)
        .get('/api/ai/usage')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('count', 0);
    });
  });

  describe('5. Conformidade LGPD & Direitos do Usuário', () => {
    it('deve salvar consentimento do usuário', async () => {
      const res = await request(app)
        .post('/api/user/consent')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ termsVersion: 'v1.0', privacyVersion: 'v1.0' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('message', 'Consentimento registrado com sucesso.');
    });

    it('deve permitir exportar dados completos da conta do usuário', async () => {
      const res = await request(app)
        .get('/api/user/export-data')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('conversations');
    });
  });

  describe('6. Telemetria & Observabilidade (Prometheus)', () => {
    it('deve retornar métricas legítimas do Prometheus em text/plain', async () => {
      supabase.from.mockReturnValue(supabase);
      supabase.select.mockReturnValue(supabase);
      supabase.eq.mockResolvedValueOnce({ count: 5, error: null });

      const res = await request(app)
        .get('/api/metrics')
        .expect(200);

      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text).toContain('medai_active_clinics');
      expect(res.text).toContain('medai_http_requests_total');
      expect(res.text).toContain('medai_ai_requests_total');
    });
  });

  describe('7. Encerramento de Sessão (Logout)', () => {
    it('deve expirar e invalidar a sessão atual no logout', async () => {
      supabase.from.mockReturnValue(supabase);
      supabase.delete.mockReturnValue(supabase);
      supabase.eq.mockResolvedValueOnce({ error: null });

      const res = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'ref-token-xyz' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
