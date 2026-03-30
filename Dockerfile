# =============================================
# Stage 1: Instalar dependências (limpo para prod)
# =============================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci

# =============================================
# Stage 2: Builder — Prisma Client + Build Next.js
# =============================================
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
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

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Copia standalone output e static assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copia o schema e migrations para o runner
COPY --from=builder /app/prisma ./prisma

# SOLUÇÃO DEFINITIVA PRISMA: Copia CLI completo, engines e binários para evitar erro .wasm
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copia dependências necessárias para o seed em produção
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Copia e configura o script de inicialização robusto
COPY --from=builder /app/scripts/start.sh ./start.sh
RUN chmod +x ./start.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Inicia o servidor através do script de inicialização robusto
CMD ["sh", "./start.sh"]
