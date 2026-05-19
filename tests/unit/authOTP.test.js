const AuthService = require('../../src/services/authService');
const AuthRepository = require('../../src/repositories/authRepository');
const supabase = require('../../config/supabase');
const bcrypt = require('bcrypt');
const logger = require('../../src/utils/logger');

jest.mock('../../src/repositories/authRepository');
jest.mock('../../src/utils/logger');

describe('AuthService - OTP Dinâmico & Bloqueio Progressivo', () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUser = {
      id: 'user-uuid-123',
      clinic_id: 'clinic-uuid-456',
      email: 'doutor@medai.com.br',
      password_hash: 'hashedPassword',
      access_code: '123456',
      access_code_expires_at: new Date(Date.now() + 600000).toISOString(), // +10 min
      access_code_attempts: 0,
      locked_until: null,
      lockout_count: 0,
      active: true
    };
  });

  describe('Stage 1 - Login & Geração de OTP', () => {
    it('deve gerar um OTP de 6 dígitos numéricos e definir validade de 10 minutos', async () => {
      AuthRepository.findUserByEmail.mockResolvedValueOnce(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValueOnce(true);
      AuthRepository.updateOTP.mockResolvedValueOnce();

      const result = await AuthService.login('doutor@medai.com.br', 'senha123');

      expect(result).toHaveProperty('userId', 'user-uuid-123');
      expect(result).toHaveProperty('emailKey', 'doutor@medai.com.br');
      
      // Valida chamada de persistência de OTP
      expect(AuthRepository.updateOTP).toHaveBeenCalledWith(
        'user-uuid-123',
        expect.stringMatching(/^\d{6}$/), // Exatamente 6 dígitos numéricos
        expect.any(String)
      );
    });

    it('deve rejeitar o login se a conta estiver sob bloqueio temporário ativo', async () => {
      mockUser.locked_until = new Date(Date.now() + 600000).toISOString(); // Bloqueado por 10 min
      AuthRepository.findUserByEmail.mockResolvedValueOnce(mockUser);

      await expect(AuthService.login('doutor@medai.com.br', 'senha123'))
        .rejects
        .toMatchObject({
          code: 'ACCOUNT_LOCKED',
          message: expect.stringContaining('Esta conta está temporariamente bloqueada')
        });
    });

    it('deve registrar o OTP nos logs SOMENTE se NODE_ENV=development', async () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Caso 1: NODE_ENV = development
      process.env.NODE_ENV = 'development';
      AuthRepository.findUserByEmail.mockResolvedValueOnce(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValueOnce(true);
      
      await AuthService.login('doutor@medai.com.br', 'senha123');
      expect(logger.info).toHaveBeenCalledWith(
        'DEVELOPMENT ONLY: Generated dynamic OTP',
        expect.objectContaining({ code: expect.any(String) })
      );

      jest.clearAllMocks();

      // Caso 2: NODE_ENV = production
      process.env.NODE_ENV = 'production';
      AuthRepository.findUserByEmail.mockResolvedValueOnce(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValueOnce(true);
      
      await AuthService.login('doutor@medai.com.br', 'senha123');
      expect(logger.info).not.toHaveBeenCalled();

      // Restaurar env original
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Stage 2 - Verificação de OTP & Lockout Progressivo', () => {
    it('deve efetuar login e resetar o estado de segurança em caso de sucesso', async () => {
      AuthRepository.findUserByEmail.mockResolvedValueOnce(mockUser);
      AuthRepository.resetSecurityState.mockResolvedValueOnce();
      
      // Mock clínica do Supabase
      supabase.single
        .mockResolvedValueOnce({ data: { id: 'clinic-uuid-456', active: true }, error: null }) // clinic
        .mockResolvedValueOnce({ data: { id: 'session-uuid' }, error: null }); // session

      const result = await AuthService.verifyAccessCode('doutor@medai.com.br', '123456', '127.0.0.1', 'Jest-Agent');

      expect(result).toHaveProperty('accessToken');
      expect(AuthRepository.resetSecurityState).toHaveBeenCalledWith('user-uuid-123');
    });

    it('deve rejeitar se o código OTP estiver expirado', async () => {
      mockUser.access_code_expires_at = new Date(Date.now() - 60000).toISOString(); // Expirado há 1 min
      AuthRepository.findUserByEmail.mockResolvedValueOnce(mockUser);

      await expect(AuthService.verifyAccessCode('doutor@medai.com.br', '123456', '127.0.0.1', 'Jest-Agent'))
        .rejects
        .toMatchObject({
          code: 'CODE_EXPIRED',
          message: 'Código de acesso expirou. Faça login novamente.'
        });
    });

    it('deve incrementar tentativas em caso de código incorreto', async () => {
      mockUser.access_code_attempts = 0;
      AuthRepository.findUserByEmail.mockResolvedValueOnce(mockUser);
      AuthRepository.incrementAttempts.mockResolvedValueOnce();

      await expect(AuthService.verifyAccessCode('doutor@medai.com.br', '999999', '127.0.0.1', 'Jest-Agent'))
        .rejects
        .toMatchObject({
          code: 'WRONG_CODE',
          message: expect.stringContaining('Você tem mais 2 tentativa(s)')
        });

      expect(AuthRepository.incrementAttempts).toHaveBeenCalledWith('user-uuid-123', 1);
    });

    it('deve bloquear a conta progressivamente ao atingir 3 tentativas erradas', async () => {
      mockUser.access_code_attempts = 2; // Já errou 2 vezes, essa é a 3ª
      mockUser.lockout_count = 0; // Primeira vez bloqueando
      AuthRepository.findUserByEmail.mockResolvedValueOnce(mockUser);
      AuthRepository.lockUser.mockResolvedValueOnce();

      await expect(AuthService.verifyAccessCode('doutor@medai.com.br', '999999', '127.0.0.1', 'Jest-Agent'))
        .rejects
        .toMatchObject({
          code: 'ACCOUNT_LOCKED',
          message: expect.stringContaining('Conta bloqueada por 15 minutos')
        });

      // 15 minutos * 1 = 15
      expect(AuthRepository.lockUser).toHaveBeenCalledWith(
        'user-uuid-123',
        expect.any(String),
        1
      );
    });

    it('deve aplicar bloqueio progressivo na reincidência de lockout', async () => {
      mockUser.access_code_attempts = 2; 
      mockUser.lockout_count = 2; // Já foi bloqueado 2 vezes antes, essa é a 3ª reincidência
      AuthRepository.findUserByEmail.mockResolvedValueOnce(mockUser);
      AuthRepository.lockUser.mockResolvedValueOnce();

      await expect(AuthService.verifyAccessCode('doutor@medai.com.br', '999999', '127.0.0.1', 'Jest-Agent'))
        .rejects
        .toMatchObject({
          code: 'ACCOUNT_LOCKED',
          message: expect.stringContaining('Conta bloqueada por 45 minutos') // 15min * 3 = 45min
        });

      expect(AuthRepository.lockUser).toHaveBeenCalledWith(
        'user-uuid-123',
        expect.any(String),
        3
      );
    });
  });
});
