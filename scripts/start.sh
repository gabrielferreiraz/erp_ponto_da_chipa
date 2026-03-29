#!/bin/sh
set -e

# ==============================================================================
# PONTO DA CHIPA: SCRIPT DE INICIALIZAÇÃO ROBUSTO (FINAL)
# ==============================================================================

echo "--- PONTO DA CHIPA ---"

# 1. Aguarda o banco de dados estar pronto
# Requer variáveis DB_HOST e DB_PORT configuradas no ambiente (EasyPanel)
if [ -n "$DB_HOST" ]; then
  echo "Aguardando banco de dados ($DB_HOST:$DB_PORT)..."
  until pg_isready -h "$DB_HOST" -p "$DB_PORT"; do
    echo "Banco ainda não está pronto. Tentando novamente em 2 segundos..."
    sleep 2
  done
  echo "Banco de dados está pronto!"
else
  echo "Aviso: DB_HOST não configurado. Pulando verificação pg_isready."
fi

# 2. Executa migrations usando o binário local absoluto do CLI
# Isso resolve o erro de arquivos .wasm faltando ao garantir o CLI completo.
echo "Executando migrations do Prisma..."
./node_modules/.bin/prisma migrate deploy

# 3. Inicia o servidor Next.js standalone
echo "Iniciando servidor Next.js..."
node server.js
