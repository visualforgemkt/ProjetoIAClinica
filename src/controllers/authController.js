const AuthService  = require('../services/authService');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

const AuthController = {
  async login(req, res) {
    try {
      const result = await AuthService.login(req.body.email, req.body.password);
      return success(res, result);
    } catch (e) {
      logger.error('Login error', { error: e.message, code: e.code });
      const status = e.code === 'USER_NOT_FOUND' || e.code === 'WRONG_PASSWORD' ? 401 : 400;
      return error(res, e.message || 'Erro ao fazer login.', status, e.code);
    }
  },

  async verifyCode(req, res) {
    try {
      const result = await AuthService.verifyAccessCode(
        req.body.emailKey,
        req.body.accessCode,
        req.ip,
        req.headers['user-agent']
      );
      logger.info('User logged in', { email: req.body.emailKey });
      return success(res, result);
    } catch (e) {
      logger.error('VerifyCode error', { error: e.message, code: e.code, email: req.body.emailKey });
      const status = ['SESSION_EXPIRED','CLINIC_INACTIVE'].includes(e.code) ? 401 : 400;
      return error(res, e.message || 'Código inválido.', status, e.code);
    }
  },

  async refresh(req, res) {
    try {
      const result = await AuthService.refresh(req.body.refreshToken);
      return success(res, result);
    } catch (e) {
      return error(res, e.message || 'Sessão inválida.', 401, e.code);
    }
  },

  async logout(req, res) {
    try {
      await AuthService.logout(req.body.refreshToken);
      return success(res, { message: 'Logout realizado.' });
    } catch {
      return success(res, { message: 'Logout realizado.' });
    }
  },

  async me(req, res) {
    return success(res, { user: req.user, clinic: req.clinic });
  }
};

module.exports = AuthController;
