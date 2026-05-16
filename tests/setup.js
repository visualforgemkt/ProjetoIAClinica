require('dotenv').config({ path: '.env.test' });
process.env.JWT_SECRET = 'jest-secret';

// O Mock do Supabase agora é feito via config/__mocks__/supabase.js
jest.mock('../config/supabase');
