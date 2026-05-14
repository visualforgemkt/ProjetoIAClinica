const supabase = require('../../config/supabase');
const logger   = require('../utils/logger');

const AuthRepository = {
  async findUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    
    const { data, error } = await supabase
      .from('users')
      .select('id, clinic_id, email, password_hash, access_code, name, initials, role, active')
      .eq('email', cleanEmail)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('findUserByEmail database error', { error: error.message, email: cleanEmail });
      throw new Error('DB_ERROR');
    }
    return data || null;
  },

  async findUserById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, clinic_id, email, name, initials, role, active')
      .eq('id', id)
      .single();
    if (error) throw new Error('DB_ERROR');
    return data || null;
  },

  async updateLastLogin(userId) {
    const { error } = await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) {
      logger.error('updateLastLogin error', { error: error.message, userId });
    }
  },

  async createSession(sessionData) {
    const { data, error } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();
    if (error) throw new Error('DB_ERROR');
    return data;
  },

  async findSession(refreshToken) {
    const { data, error } = await supabase
      .from('sessions')
      .select('id, user_id, clinic_id, expires_at')
      .eq('refresh_token', refreshToken)
      .single();
    if (error) return null;
    return data;
  },

  async deleteSession(refreshToken) {
    if (!refreshToken) return;
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('refresh_token', refreshToken);
    
    if (error) {
      logger.error('deleteSession error', { error: error.message });
    }
  },

  async deleteExpiredSessions() {
    await supabase
      .from('sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());
  }
};

module.exports = AuthRepository;
