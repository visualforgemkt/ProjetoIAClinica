let currentTable = '';

const mockChain = {
  select: jest.fn(() => mockChain),
  insert: jest.fn(() => mockChain),
  update: jest.fn(() => mockChain),
  delete: jest.fn(() => mockChain),
  eq: jest.fn(() => mockChain),
  order: jest.fn(() => mockChain),
  lt: jest.fn(() => mockChain),
  gt: jest.fn(() => mockChain),
  lte: jest.fn(() => mockChain),
  gte: jest.fn(() => mockChain),
  limit: jest.fn(() => mockChain),
  neq: jest.fn(() => mockChain),
  ilike: jest.fn(() => mockChain),
  like: jest.fn(() => mockChain),
  in: jest.fn(() => mockChain),
  or: jest.fn(() => mockChain),
  and: jest.fn(() => mockChain),
  not: jest.fn(() => mockChain),
  single: jest.fn(async () => {
    if (currentTable === 'users') {
      return {
        data: {
          id: 'u-123',
          clinic_id: 'c-456',
          email: 'doutor@medai.com.br',
          password_hash: '$2b$10$Gyn0RJFouUNf6/2t9ahU7eMZS7naI7HQH.VdoiwMeBdIxTfw3Npbi', // 'senhaValida123'
          access_code: '987654',
          access_code_expires_at: new Date(Date.now() + 600000).toISOString(),
          access_code_attempts: 0,
          locked_until: null,
          lockout_count: 0,
          name: 'Dr. MedAI',
          initials: 'DM',
          role: 'doctor',
          active: true
        },
        error: null
      };
    }
    if (currentTable === 'clinics') {
      return {
        data: {
          id: 'c-456',
          name: 'Clínica MedAI',
          slug: 'clinica-medai',
          specialty: 'Cardiologia',
          city: 'São Paulo',
          tone: 'professional',
          visual_style: 'clean',
          brand_color1: '#0070f3',
          brand_color2: '#000000',
          monthly_limit: 1000,
          plan_id: 'premium',
          active: true
        },
        error: null
      };
    }
    if (currentTable === 'sessions') {
      return {
        data: {
          id: 's-789',
          user_id: 'u-123',
          clinic_id: 'c-456',
          refresh_token: 'ref-token-xyz',
          expires_at: new Date(Date.now() + 604800000).toISOString()
        },
        error: null
      };
    }
    return { data: null, error: null };
  }),
  then: jest.fn((onFulfilled) => {
    let result = { data: [], error: null };
    if (currentTable === 'conversations') {
      result = {
        data: [{ id: 'conv-123', intent: 'medico', title: 'Dúvida de saúde', message_count: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
        error: null
      };
    } else if (currentTable === 'messages') {
      result = {
        data: [{ id: 'msg-1', role: 'user', content: 'Olá', intent: 'medico', created_at: new Date().toISOString() }],
        error: null
      };
    }
    return Promise.resolve(result).then(onFulfilled);
  })
};

module.exports = {
  from: jest.fn((table) => {
    currentTable = table;
    return mockChain;
  }),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  ...mockChain
};
