#!/bin/sh

# ==============================================================================
# BACKUP AUTOMÁTICO DO POSTGRESQL - PONTO DA CHIPA
# ==============================================================================
# Instruções: Configurar no EasyPanel > App > Cron Jobs
# Comando: /bin/sh /app/scripts/backup.sh
# Intervalo: 0 0 * * * (todo dia à meia-noite)

# Diretório para salvar os backups (montar volume no EasyPanel)
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

echo "--- PONTO DA CHIPA: INICIANDO BACKUP ---"

# 1. Garante que o diretório exista
mkdir -p $BACKUP_DIR

# 2. Executa o dump direto da DATABASE_URL (contém usuário, senha e host)
# Nota: DATABASE_URL deve estar disponível no ambiente onde o cron roda.
if [ -z "$DATABASE_URL" ]; then
    echo "ERRO: DATABASE_URL não definida. Abortando backup."
    exit 1
fi

echo "[1/2] Realizando dump para $BACKUP_FILE..."
pg_dump $DATABASE_URL > $BACKUP_FILE

# 3. Retenção de 7 dias: remove arquivos antigos para poupar espaço
echo "[2/2] Limpando backups antigos (retenção de 7 dias)..."
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "--- BACKUP CONCLUÍDO COM SUCESSO! ---"
