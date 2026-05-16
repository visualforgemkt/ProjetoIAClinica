// Setup file for Jest
require('dotenv').config({ path: '.env.test' });

// Mock do Supabase para evitar chamadas reais durante os testes
jest.mock('./src/config/supabase', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
}));
