# ═══════════════════════════════════════════════════════════════
# Stage 1: Build & Dependencies
# ═══════════════════════════════════════════════════════════════
FROM node:18-alpine AS builder

WORKDIR /app

# Copia arquivos de definição de dependências
COPY package*.json ./

# Instala dependências de produção e desenvolvimento para validações
RUN npm ci

# Copia o código fonte do backend
COPY . .

# Remove módulos de teste/desenvolvimento para economizar espaço
RUN npm prune --production

# ═══════════════════════════════════════════════════════════════
# Stage 2: Production Runtime
# ═══════════════════════════════════════════════════════════════
FROM node:18-alpine AS runner

WORKDIR /app

# Define variáveis de produção recomendadas
ENV NODE_ENV=production
ENV PORT=3001

# Copia dependências limpas e código fonte otimizado do builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/config ./config
COPY --from=builder /app/package.json ./package.json

# Cria pasta de logs
RUN mkdir -p logs && chown -R node:node /app

# Executa como usuário sem privilégios (segurança OWASP)
USER node

# Porta padrão exposta
EXPOSE 3001

# Comando de inicialização nativo
CMD ["npm", "start"]
