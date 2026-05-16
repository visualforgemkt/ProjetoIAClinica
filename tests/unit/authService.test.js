const AuthService = require('../../src/services/authService');
const supabase = require('../../src/config/supabase');
const bcrypt = require('bcrypt');

describe('AuthService - Authentication & Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve falhar login se usuário não existir', async () => {
    supabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

    await expect(AuthService.login('inexistente@clinica.com', 'senha123'))
      .rejects
      .toThrow('Usuário não encontrado.');
  });

  it('deve realizar login com credenciais corretas', async () => {
    const mockUser = {
      id: 'uuid-1',
      clinic_id: 'clinic-1',
      email: 'doutor@clinica.com',
      password_hash: await bcrypt.hash('senhaValida123', 10),
      access_code: 'CODE-123',
      active: true,
      clinics: { active: true }
    };

    supabase.single.mockResolvedValueOnce({ data: mockUser, error: null });

    const result = await AuthService.login('doutor@clinica.com', 'senhaValida123');

    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('emailKey');
    expect(result.message).toContain('Código de acesso');
  });

  it('deve gerar JWT válido após verificação do código', async () => {
    const mockUser = {
      id: 'uuid-1',
      clinic_id: 'clinic-1',
      access_code: 'CODE-123',
      clinics: { active: true }
    };

    supabase.single.mockResolvedValueOnce({ data: mockUser, error: null });
    supabase.insert.mockResolvedValueOnce({ data: {}, error: null }); // session mock

    const result = await AuthService.verifyAccessCode('doutor@clinica.com', 'CODE-123', '127.0.0.1', 'Jest-Agent');

    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('refreshToken');
    expect(result).toHaveProperty('user');
  });
});
