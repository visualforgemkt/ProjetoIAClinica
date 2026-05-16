const AuthService = require('../../src/services/authService');
const supabase = require('../../config/supabase');
const bcrypt = require('bcrypt');

describe('AuthService - Authentication & Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve falhar login se usuário não existir', async () => {
    supabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    await expect(AuthService.login('inexistente@clinica.com', 'senha123'))
      .rejects
      .toMatchObject({ message: 'E-mail não encontrado.' });
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

    expect(result).toHaveProperty('userId');
    expect(result).toHaveProperty('emailKey');
  });

  it('deve gerar JWT válido após verificação do código', async () => {
    const mockUser = {
      id: 'uuid-1',
      clinic_id: 'clinic-1',
      access_code: 'CODE-123',
      access_code_expires_at: new Date(Date.now() + 60000).toISOString(),
      active: true,
      clinics: { active: true }
    };

    supabase.single
      .mockResolvedValueOnce({ data: mockUser, error: null }) // user
      .mockResolvedValueOnce({ data: { id: 'clinic-1', active: true }, error: null }); // clinic
    
    supabase.insert.mockReturnValueOnce(supabase);
    supabase.select.mockReturnValueOnce(supabase);
    supabase.single.mockResolvedValueOnce({ data: { id: 'session-1' }, error: null }); // session

    const result = await AuthService.verifyAccessCode('doutor@clinica.com', 'CODE-123', '127.0.0.1', 'Jest-Agent');

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result).toHaveProperty('user');
  });
});
