const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const AuthRepository = require('../repositories/authRepository');
const supabase = require('../../config/supabase');
const logger   = require('../utils/logger');

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

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw { code: 'WRONG_PASSWORD', message: 'Senha incorreta. Tente novamente.' };

    return { emailKey: cleanEmail, userId: user.id };
  },

  /**
   * Etapa 2: valida código de acesso e emite tokens
   */
  async verifyAccessCode(emailKey, accessCode, ip, userAgent) {
    const user = await AuthRepository.findUserByEmail(emailKey);
    if (!user || !user.active) throw { code: 'SESSION_EXPIRED', message: 'Sessão expirada. Faça login novamente.' };

    const input  = (accessCode || '').trim().toUpperCase();
    const stored = (user.access_code || '').trim().toUpperCase();
    if (!input)         throw { code: 'CODE_EMPTY',  message: 'Digite o código de acesso.' };
    if (input !== stored) throw { code: 'WRONG_CODE', message: 'Código de acesso inválido.' };

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
    if (refreshToken) await AuthRepository.deleteSession(refreshToken);
  }
};

module.exports = AuthService;
