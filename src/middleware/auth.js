const jwt = require('jsonwebtoken');
const supabase = require('../../config/supabase');
const { error } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Verifica JWT e injeta req.user + req.clinic
 * Garante isolamento multi-tenant em todas as rotas protegidas
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Token de acesso não fornecido', 401, 'MISSING_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        return error(res, 'Sessão expirada. Faça login novamente.', 401, 'TOKEN_EXPIRED');
      }
      return error(res, 'Token inválido.', 401, 'INVALID_TOKEN');
    }

    // Carregar usuário + clínica do banco (garante que não foi desativado)
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, clinic_id, email, name, initials, role, active')
      .eq('id', decoded.userId)
      .single();

    if (userErr || !user || !user.active) {
      return error(res, 'Usuário não encontrado ou desativado.', 401, 'USER_INACTIVE');
    }

    const { data: clinic, error: clinicErr } = await supabase
      .from('clinics')
      .select('id, name, slug, specialty, city, tone, visual_style, brand_color1, brand_color2, monthly_limit, active')
      .eq('id', user.clinic_id)
      .single();

    if (clinicErr || !clinic || !clinic.active) {
      return error(res, 'Clínica não encontrada ou desativada.', 401, 'CLINIC_INACTIVE');
    }

    // Injetar no request — disponível em todos os controllers
    req.user   = user;
    req.clinic = clinic;
    req.clinicId = clinic.id;  // atalho conveniente

    next();
  } catch (e) {
    logger.error('Auth middleware error', { error: e.message });
    return error(res, 'Erro interno de autenticação.', 500, 'AUTH_ERROR');
  }
}

/**
 * Verifica se o usuário tem role específico
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return error(res, 'Permissão insuficiente.', 403, 'FORBIDDEN');
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole };
