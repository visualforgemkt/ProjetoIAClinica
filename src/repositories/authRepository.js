const supabase = require('../../config/supabase');
const logger   = require('../utils/logger');

const AuthRepository = {
  async findUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    
    const { data, error } = await supabase
      .from('users')
      .select('id, clinic_id, email, password_hash, access_code, access_code_expires_at, access_code_attempts, locked_until, lockout_count, name, initials, role, active')
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
  },

  async updateOTP(userId, code, expiresAt) {
    const { error } = await supabase
      .from('users')
      .update({ 
        access_code: code,
        access_code_expires_at: expiresAt,
        access_code_attempts: 0
      })
      .eq('id', userId);
    
    if (error) {
      logger.error('updateOTP database error', { error: error.message, userId });
      throw new Error('DB_ERROR');
    }
  },

  async incrementAttempts(userId, attemptsCount) {
    const { error } = await supabase
      .from('users')
      .update({ access_code_attempts: attemptsCount })
      .eq('id', userId);
    
    if (error) {
      logger.error('incrementAttempts database error', { error: error.message, userId });
      throw new Error('DB_ERROR');
    }
  },

  async lockUser(userId, lockedUntil, lockoutCount) {
    const { error } = await supabase
      .from('users')
      .update({ 
        locked_until: lockedUntil,
        lockout_count: lockoutCount,
        access_code_attempts: 0
      })
      .eq('id', userId);
    
    if (error) {
      logger.error('lockUser database error', { error: error.message, userId });
      throw new Error('DB_ERROR');
    }
  },

  async resetSecurityState(userId) {
    const { error } = await supabase
      .from('users')
      .update({ 
        access_code: 'USED',
        access_code_expires_at: new Date(0).toISOString(),
        access_code_attempts: 0,
        locked_until: null,
        lockout_count: 0
      })
      .eq('id', userId);
    
    if (error) {
      logger.error('resetSecurityState database error', { error: error.message, userId });
      throw new Error('DB_ERROR');
    }
  }
};

module.exports = AuthRepository;
