require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws'); // Necessário para Node < 20

async function testConnection() {
  console.log('--- Testando Conexão Supabase (v2) ---');
  
  const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_KEY,
    {
      realtime: { transport: ws } // Correção para Node 18
    }
  );
  
  try {
    console.log('Enviando requisição para:', process.env.SUPABASE_URL);
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    if (error) {
      console.error('❌ Erro retornado pelo Supabase:', error.message);
      console.error('Código:', error.code);
    } else {
      console.log('✅ Conexão estabelecida com sucesso!');
      console.log('Dados recebidos:', data);
    }
  } catch (e) {
    console.error('💥 Erro de Rede (Fetch):', e.message);
    if (e.cause) {
        console.error('Causa detalhada:', e.cause.message || e.cause);
        if (e.cause.code) console.error('Código da Causa:', e.cause.code);
    }
  }
}

testConnection();
