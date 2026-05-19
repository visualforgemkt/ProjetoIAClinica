#!/usr/bin/env node
/**
 * MedAI Pro — Secret Scanner
 *
 * Varre todos os arquivos do projeto buscando padrões de segredos reais
 * (chaves de API, JWTs, senhas hardcoded, URLs sensíveis).
 *
 * Uso:
 *   npm run scan           → escaneia tudo
 *   npm run scan -- --fix  → mostra achados com linha exata
 *
 * Integrar no CI/CD:
 *   - GitHub Actions: rodar como step antes do deploy
 *   - Pre-commit hook: adicionar ao .git/hooks/pre-commit
 */

const fs   = require('fs');
const path = require('path');

// ── Padrões de segredos a detectar ───────────────────────────────────────────
const SECRET_PATTERNS = [
  // Anthropic
  { name: 'Anthropic API Key',     regex: /sk-ant-api[0-9]+-[A-Za-z0-9_-]{40,}/g },
  // OpenAI
  { name: 'OpenAI API Key',        regex: /sk-proj-[A-Za-z0-9_-]{40,}/g },
  { name: 'OpenAI API Key (legacy)',regex: /sk-[A-Za-z0-9]{48}/g },
  // JWTs (eyJ... — base64 encoded header)
  { name: 'JWT / Supabase Token',  regex: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g },
  // Supabase URLs com projeto real
  { name: 'Supabase Project URL',  regex: /https:\/\/[a-z]{20}\.supabase\.co/g },
  // Senhas hardcoded comuns
  { name: 'Hardcoded Password',    regex: /password\s*[:=]\s*["'][^"']{6,}["']/gi },
  // Placeholder fraco de JWT
  { name: 'Weak JWT Secret',       regex: /GERAR_COM_openssl/g },
  // Chaves genéricas longas em strings
  { name: 'Possible API Key',      regex: /["'][A-Za-z0-9+\/]{40,}={0,2}["']/g },
];

// ── Arquivos e pastas a ignorar ───────────────────────────────────────────────
const IGNORE_DIRS  = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', 'logs', '.nyc_output']);
const IGNORE_FILES = new Set(['.env', '.env.local', '.env.production']); // .env é local — não versionar
const IGNORE_EXTS  = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.map', '.lock']);

// Falsos positivos conhecidos (strings que são placeholders, não chaves reais)
const FALSE_POSITIVES = [
  'YOUR_SUPABASE_SERVICE_ROLE_KEY',
  'YOUR_STRONG_RANDOM_SECRET',
  'sk-ant-api03-YOUR_KEY_HERE',
  'sk-proj-YOUR_KEY_HERE',
  'SUBSTITUIR_APOS_ROTACIONAR',
  'PLACEHOLDER_HASH_REPLACE_WITH_REAL_BCRYPT',
  // O próprio scanner contém esses padrões nas suas regexes — não é segredo real
  'GERAR_COM_openssl',
  'scan-secrets.js',
];

// ── Utilitários ───────────────────────────────────────────────────────────────
function isFalsePositive(match) {
  return FALSE_POSITIVES.some(fp => match.includes(fp));
}

function scanFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (IGNORE_EXTS.has(ext)) return [];

  let content;
  try { content = fs.readFileSync(filePath, 'utf8'); }
  catch (_) { return []; }

  const findings = [];
  const lines = content.split('\n');

  for (const { name, regex } of SECRET_PATTERNS) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (isFalsePositive(match[0])) continue;

      // Calcular número da linha
      const before = content.substring(0, match.index);
      const lineNum = before.split('\n').length;
      const lineContent = lines[lineNum - 1]?.trim() || '';

      findings.push({
        file:    filePath,
        pattern: name,
        line:    lineNum,
        match:   match[0].substring(0, 40) + (match[0].length > 40 ? '…' : ''),
        context: lineContent.substring(0, 80) + (lineContent.length > 80 ? '…' : '')
      });
    }
  }

  return findings;
}

function scanDir(dir) {
  let results = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (_) { return results; }

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(scanDir(full));
    } else if (entry.isFile()) {
      if (IGNORE_FILES.has(entry.name)) continue;
      results = results.concat(scanFile(full));
    }
  }
  return results;
}

// ── Main ─────────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
console.log(`\n🔍 MedAI Pro — Secret Scanner`);
console.log(`📁 Escaneando: ${ROOT}\n`);

const findings = scanDir(ROOT);

if (findings.length === 0) {
  console.log('✅  Nenhum segredo detectado. Projeto limpo.\n');
  process.exit(0);
} else {
  console.error(`🚨  ATENÇÃO: ${findings.length} possível(is) segredo(s) encontrado(s)!\n`);
  for (const f of findings) {
    console.error(`  📄 ${path.relative(ROOT, f.file)}:${f.line}`);
    console.error(`     Padrão : ${f.pattern}`);
    console.error(`     Trecho : ${f.match}`);
    console.error(`     Contexto: ${f.context}`);
    console.error('');
  }
  console.error('❌  Corrija os achados acima antes de commitar ou deployar.\n');
  process.exit(1);
}
