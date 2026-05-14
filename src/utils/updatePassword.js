/**
 * MedAI Pro — Utilitário para atualizar senha de usuário
 * Uso: node src/utils/updatePassword.js <email> <nova_senha>
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const supabase = require('../../config/supabase');

async function updatePassword() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.log('Uso: node src/utils/updatePassword.js <email> <nova_senha>');
    process.exit(1);
  }

  console.log(`Atualizando senha para: ${email}...`);

  const hash = await bcrypt.hash(password, 12);

  const { data, error } = await supabase
    .from('users')
    .update({ password_hash: hash })
    .eq('email', email.toLowerCase().trim())
    .select();

  if (error) {
    console.error('Erro ao atualizar senha:', error.message);
    process.exit(1);
  }

  if (data.length === 0) {
    console.error('Usuário não encontrado.');
    process.exit(1);
  }

  console.log('Senha atualizada com sucesso!');
  process.exit(0);
}

updatePassword();
