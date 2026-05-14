const supabase = require('../../config/supabase');
const logger   = require('../utils/logger');

const UsageRepository = {
  async log(entry) {
    const { error } = await supabase.from('usage_logs').insert({
      clinic_id:     entry.clinicId,
      user_id:       entry.userId,
      intent:        entry.intent,
      agent_id:      entry.agentId,
      tokens_input:  entry.tokensInput  || 0,
      tokens_output: entry.tokensOutput || 0,
      tokens_total:  entry.tokensTotal  || 0,
      provider:      entry.provider     || 'anthropic',
      model:         entry.model,
      status:        entry.status,
      duration_ms:   entry.durationMs   || 0,
      cost_usd:      entry.costUsd      || 0
    });
    if (error) logger.error('Usage log error', { error: error.message });
  },

  async getMonthlyUsage(clinicId) {
    const start = new Date();
    start.setDate(1); start.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('usage_logs')
      .select('id, intent, status, tokens_total, created_at')
      .eq('clinic_id', clinicId)
      .gte('created_at', start.toISOString())
      .neq('status', 'limit_exceeded')
      .order('created_at', { ascending: false });

    if (error) { logger.error('getMonthlyUsage error', { error: error.message }); return []; }
    return data || [];
  },

  async getMonthlyCount(clinicId) {
    const usage = await this.getMonthlyUsage(clinicId);
    return usage.filter(r => r.status !== 'error').length;
  },

  async checkLimit(clinicId, monthlyLimit) {
    const count = await this.getMonthlyCount(clinicId);
    return { count, limit: monthlyLimit, exceeded: count >= monthlyLimit };
  }
};

module.exports = UsageRepository;
