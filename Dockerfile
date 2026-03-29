# =============================================
# Stage 1: Instalar dependências (limpo para prod)
# =============================================
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copia apenas o necessário para o cache de deps
COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

# =============================================
# Stage 2: Builder — Prisma Client + Build Next.js
# =============================================
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copia node_modules já instalados (stage 1)
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gera o Prisma Client com base no schema (Prisma 5.22.0 fixo)
RUN npx prisma generate

# Build de produção (standalone output)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# =============================================
# Stage 3: Runner — Imagem mínima e segura
# =============================================
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat openssl postgresql-client

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Cria usuário não-root por segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia standalone output e static assets
COPY --from=builder /app/public* ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copia scripts de inicialização e backup
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
RUN chmod +x scripts/*.sh

# Garante acesso ao Prisma Client, CLI e Motores (Engines) para evitar erros .wasm
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma/engines ./node_modules/@prisma/engines
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Executa o script de inicialização robusto
CMD ["sh", "scripts/start.sh"]
