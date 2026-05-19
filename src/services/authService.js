const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto   = require('crypto');
const AuthRepository = require('../repositories/authRepository');
const supabase = require('../../config/supabase');
const logger   = require('../utils/logger');
const eventBus = require('../core/eventBus');
const { EventType } = require('./trackingService');

const AuthService = {
  /**
   * Etapa 1: valida e-mail + senha
   */
  async login(email, password) {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) throw { code: 'INVALID_INPUT', message: 'E-mail obrigatório.' };

    const user = await AuthRepository.findUserByEmail(cleanEmail);
    if (!user) throw { code: 'USER_NOT_FOUND', message: 'E-mail não encontrado.' };
    if (!user.active) throw { code: 'USER_INACTIVE', message: 'Conta desativada. Contate o suporte.' };

    // Validar bloqueio temporário ativo por tentativas incorretas
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 1000 / 60);
      throw { 
        code: 'ACCOUNT_LOCKED', 
        message: `Esta conta está temporariamente bloqueada devido a sucessivas tentativas incorretas. Tente novamente em ${minutesLeft} minuto(s).` 
      };
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw { code: 'WRONG_PASSWORD', message: 'Senha incorreta. Tente novamente.' };

    // Gerar OTP dinâmico numérico de 6 dígitos
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Expiração em 10 minutos

    // Salvar estado de segurança do OTP
    await AuthRepository.updateOTP(user.id, otpCode, expiresAt.toISOString());

    // Exibir OTP nos logs SOMENTE em ambiente de desenvolvimento (NODE_ENV=development)
    if (process.env.NODE_ENV === 'development') {
      logger.info('DEVELOPMENT ONLY: Generated dynamic OTP', { email: cleanEmail, code: otpCode });
    }

    return { emailKey: cleanEmail, userId: user.id };
  },

  /**
   * Etapa 2: valida código de acesso e emite tokens
   */
  async verifyAccessCode(emailKey, accessCode, ip, userAgent) {
    const user = await AuthRepository.findUserByEmail(emailKey);
    if (!user || !user.active) throw { code: 'SESSION_EXPIRED', message: 'Sessão expirada. Faça login novamente.' };

    // Validar bloqueio temporário ativo por tentativas incorretas
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 1000 / 60);
      throw { 
        code: 'ACCOUNT_LOCKED', 
        message: `Esta conta está bloqueada. Tente novamente em ${minutesLeft} minuto(s).` 
      };
    }

    const input = (accessCode || '').trim();
    if (!input) throw { code: 'CODE_EMPTY', message: 'Digite o código de acesso.' };

    // Validar expiração do código OTP (10 minutos)
    if (user.access_code_expires_at && new Date() > new Date(user.access_code_expires_at)) {
      throw { code: 'CODE_EXPIRED', message: 'Código de acesso expirou. Faça login novamente.' };
    }

    const stored = (user.access_code || '').trim();
    
    // Comparação do código
    if (input !== stored) {
      const currentAttempts = (user.access_code_attempts || 0) + 1;
      
      if (currentAttempts >= 3) {
        // Bloqueio progressivo: 15 minutos multiplicados pela contagem acumulada de bloqueios
        const nextLockoutCount = (user.lockout_count || 0) + 1;
        const lockoutDurationMinutes = 15 * nextLockoutCount;
        const lockedUntil = new Date();
        lockedUntil.setMinutes(lockedUntil.getMinutes() + lockoutDurationMinutes);

        await AuthRepository.lockUser(user.id, lockedUntil.toISOString(), nextLockoutCount);

        logger.warn('User lockout activated', { email: emailKey, lockoutCount: nextLockoutCount, duration: lockoutDurationMinutes });

        throw {
          code: 'ACCOUNT_LOCKED',
          message: `Número máximo de tentativas incorretas atingido. Conta bloqueada por ${lockoutDurationMinutes} minutos.`
        };
      } else {
        await AuthRepository.incrementAttempts(user.id, currentAttempts);
        const remaining = 3 - currentAttempts;
        throw {
          code: 'WRONG_CODE',
          message: `Código inválido. Você tem mais ${remaining} tentativa(s) antes do bloqueio.`
        };
      }
    }

    // Invalidação imediata de OTP e liberação de bloqueios após autenticação bem-sucedida
    await AuthRepository.resetSecurityState(user.id);

    // Carregar dados da clínica
    const { data: clinic, error: clinicErr } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', user.clinic_id)
      .single();

    if (clinicErr) {
      logger.error('Error loading clinic during auth', { error: clinicErr.message, userId: user.id });
      throw { code: 'AUTH_ERROR', message: 'Erro ao carregar dados da clínica.' };
    }

    if (!clinic || !clinic.active) {
      throw { code: 'CLINIC_INACTIVE', message: 'Sua clínica está desativada. Contate o suporte.' };
    }

    // Gerar tokens
    const accessToken = jwt.sign(
      { userId: user.id, clinicId: clinic.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await AuthRepository.createSession({
      user_id: user.id, clinic_id: clinic.id,
      refresh_token: refreshToken,
      expires_at: expiresAt.toISOString(),
      ip_address: ip, user_agent: userAgent
    });

    await AuthRepository.updateLastLogin(user.id);

    // Track login success
    eventBus.emitEvent(EventType.LOGIN, {
      clinicId: clinic.id,
      userId: user.id,
      module: 'AUTH',
      screen: 'Login',
      metadata: { ip, userAgent }
    });

    return {
      accessToken, refreshToken,
      user: { id: user.id, email: user.email, name: user.name, initials: user.initials, role: user.role },
      clinic: {
        id: clinic.id, name: clinic.name, slug: clinic.slug,
        specialty: clinic.specialty, city: clinic.city,
        tone: clinic.tone, visual_style: clinic.visual_style,
        brand_color1: clinic.brand_color1, brand_color2: clinic.brand_color2,
        monthly_limit: clinic.monthly_limit, plan_id: clinic.plan_id
      }
    };
  },

  /**
   * Refresh de access token usando refresh token
   */
  async refresh(refreshToken) {
    const session = await AuthRepository.findSession(refreshToken);
    if (!session) throw { code: 'INVALID_REFRESH', message: 'Sessão inválida. Faça login novamente.' };
    
    if (new Date(session.expires_at) < new Date()) {
      await AuthRepository.deleteSession(refreshToken);
      throw { code: 'REFRESH_EXPIRED', message: 'Sessão expirada. Faça login novamente.' };
    }

    // Carregar role atualizado do usuário
    const user = await AuthRepository.findUserById(session.user_id);
    if (!user || !user.active) {
      throw { code: 'USER_INACTIVE', message: 'Usuário desativado.' };
    }

    const accessToken = jwt.sign(
      { userId: session.user_id, clinicId: session.clinic_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    return { accessToken };
  },

  async logout(refreshToken) {
    if (refreshToken) {
      const session = await AuthRepository.findSession(refreshToken);
      if (session) {
        eventBus.emitEvent(EventType.LOGOUT, {
          clinicId: session.clinic_id,
          userId: session.user_id,
          module: 'AUTH',
          screen: 'Logout'
        });
      }
      await AuthRepository.deleteSession(refreshToken);
    }
  }
};

module.exports = AuthService;
