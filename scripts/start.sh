#!/bin/sh
set -e

# O script interrompe a execução (set -e) se qualquer comando falhar.
# Isso garante que o container não suba com o banco de dados desatualizado.

echo "--- PONTO DA CHIPA: INICIALIZAÇÃO ---"

# 1. Executar migrations pendentes (deploy mode - seguro para produção)
echo "[1/2] Executando migrations do Prisma..."
npx prisma migrate deploy

# 2. Iniciar o servidor Next.js standalone (gerado pelo build)
echo "[2/2] Iniciando servidor standalone..."
node server.js
