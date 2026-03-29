#!/bin/sh
set -e

# O script simplificado apenas inicia o servidor Next.js standalone.
# As migrations devem ser executadas via Deploy Command no EasyPanel:
# npx prisma migrate deploy

echo "--- PONTO DA CHIPA: INICIALIZAÇÃO ---"

echo "[1/1] Iniciando servidor standalone..."
node server.js
