# MedAI Pro — Backend

Backend Node.js/Express para a plataforma SaaS MedAI Pro.

## Stack

- **Runtime:** Node.js 18+
- **Framework:** Express
- **Banco:** PostgreSQL via Supabase
- **Auth:** JWT + Refresh Token
- **IA:** Anthropic Claude (principal) + OpenAI (fallback)
- **Validação:** Joi
- **Logs:** Winston

## Arquitetura

```
src/
├── server.js              # Entry point
├── routes/index.js        # Todas as rotas
├── controllers/           # HTTP handlers
│   ├── authController.js
│   ├── aiController.js
│   └── clinicController.js
├── services/              # Business logic
│   ├── authService.js
│   └── aiService.js
├── repositories/          # Database access
│   ├── authRepository.js
│   └── usageRepository.js
├── middleware/
│   ├── auth.js            # JWT validation + multi-tenant isolation
│   ├── rateLimiter.js
│   └── validator.js
├── ai/
│   ├── gateway.js         # Provider-agnostic AI layer
│   ├── orchestrator.js    # Intent → Context → Prompt → Agent → Output
│   └── agentPrompts.js
└── utils/
    ├── logger.js
    └── response.js
config/
└── supabase.js
sql/
└── 001_schema.sql         # Schema completo com RLS
```

## Setup em 5 passos

### 1. Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito
2. Vá em **SQL Editor** e cole o conteúdo de `sql/001_schema.sql`
3. Execute — isso cria todas as tabelas, índices e RLS
4. Vá em **Settings → API** e copie:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_KEY`

### 2. Variáveis de ambiente

```bash
cp .env.example .env
# Edite .env com seus valores reais
```

### 3. Gerar hash da senha do usuário demo

```bash
node -e "require('bcrypt').hash('MedAI@2025!', 12, (_, h) => console.log(h))"
```

Cole o resultado no SQL e execute no Supabase:

```sql
UPDATE users
SET password_hash = 'RESULTADO_AQUI'
WHERE email = 'doutorgregory@clinica.com.br';
```

### 4. Instalar e rodar

```bash
npm install
npm run dev      # desenvolvimento (com nodemon)
npm start        # produção
```

### 5. Conectar o frontend

No arquivo `MedAI-Pro.html`, configure antes de usar:

```js
window.MEDAI_BACKEND_URL = 'http://localhost:3001';
```

Em produção, atualize para a URL real do backend (Railway, Render, etc).

## Rotas da API

### Autenticação (público)
```
POST /api/auth/login          { email, password }
POST /api/auth/verify         { emailKey, accessCode }
POST /api/auth/refresh        { refreshToken }
POST /api/auth/logout         { refreshToken }
GET  /api/auth/me             → Bearer token
```

### IA (requer auth)
```
POST /api/ai/chat             { message, conversationId?, intent? }
GET  /api/ai/conversations
GET  /api/ai/conversations/:id
GET  /api/ai/usage
```

### Clínica (requer auth)
```
GET  /api/clinic/context
PUT  /api/clinic/context      { nome, especialidade, ... }
GET  /api/clinic/campaigns
GET  /api/clinic/campaigns/:id
```

## Deploy (Railway — recomendado)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login e deploy
railway login
railway init
railway up

# Configurar variáveis de ambiente no dashboard Railway
```

## Segurança

- ✅ Helmet (headers de segurança)
- ✅ CORS configurado por origem
- ✅ Rate limiting global + específico para IA
- ✅ JWT com expiração curta (15min) + refresh token (7 dias)
- ✅ Bcrypt para senhas (cost 12)
- ✅ Row Level Security no Supabase
- ✅ Isolamento multi-tenant por `clinic_id`
- ✅ Validação de input com Joi
- ✅ Chaves de API somente no servidor
