# 🔐 Segurança — MedAI Pro

## Rotação Obrigatória de Credenciais

> ⚠️ **AÇÃO IMEDIATA NECESSÁRIA**  
> As chaves de API abaixo estavam presentes no arquivo `.env` local.  
> Mesmo que o `.env` esteja no `.gitignore`, a exposição em máquina com  
> sincronização em nuvem (OneDrive, iCloud, Dropbox) é considerada comprometimento.  
> **Rotacione todas as chaves antes de reiniciar o servidor.**

### Checklist de Rotação

- [ ] **Supabase Service Role Key**
  - URL: https://supabase.com/dashboard → Project Settings → API → Reset service_role key
  - Após rotacionar, substitua `SUPABASE_SERVICE_KEY` no `.env`

- [ ] **Anthropic API Key**  
  - URL: https://console.anthropic.com/settings/keys → Delete a chave antiga → Criar nova
  - Após rotacionar, substitua `ANTHROPIC_API_KEY` no `.env`

- [ ] **OpenAI API Key** (se em uso)
  - URL: https://platform.openai.com/api-keys → Revoke → Create new
  - Após rotacionar, substitua `OPENAI_API_KEY` no `.env`

- [x] **JWT Secret** — ✅ Nova chave forte gerada em 2026-05-19 via `crypto.randomBytes(64)`

---

## Boas Práticas

### Nunca commitar segredos
O `.env` está no `.gitignore`. Antes de qualquer commit, rode:
```bash
npm run scan
```

### Gerar novo JWT Secret
```bash
npm run generate-jwt
```

### Verificar projeto antes de deploy
```bash
npm run check
```
Executa o scan de segredos + testes automatizados.

---

## Reportar Vulnerabilidades

Se você encontrar uma vulnerabilidade de segurança no projeto,  
**não abra uma issue pública**. Entre em contato diretamente com a equipe.

---

## Histórico de Incidentes de Segurança

| Data | Severidade | Descrição | Status |
|------|-----------|-----------|--------|
| 2026-05-19 | P0 | Chaves de API presentes no `.env` local (máquina com OneDrive ativo) | 🔄 Em rotação |
| 2026-05-19 | P0 | JWT_SECRET com placeholder fraco | ✅ Corrigido |
| 2026-05-19 | P0 | `console.log` expondo SUPABASE_URL no boot | ✅ Corrigido |
