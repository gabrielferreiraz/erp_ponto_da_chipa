# Guia de Deploy: Ponto da Chipa (EasyPanel + Hostinger)

Este documento detalha o processo de deploy da aplicação Ponto da Chipa utilizando EasyPanel em uma VPS Hostinger.

---

## 📋 Checklist Pré-Deploy (Local)

Antes de realizar o deploy, garanta que:

1.  **Tipagem**: Rode `npx tsc --noEmit` para garantir que não existam erros de TypeScript.
2.  **Build**: Execute `npm run build` localmente para validar a integridade do standalone output.
3.  **Ambiente**: Certifique-se de que as variáveis do `.env.production` estão prontas (DATABASE_URL, AUTH_SECRET, etc.).

---

## 🚀 Passo a Passo no EasyPanel

### 1. Criar o Banco de Dados (PostgreSQL)
- No EasyPanel, vá em **Templates** > **PostgreSQL**.
- Nomeie o banco como `db-pontodachipa`.
- Copie a **Internal Database URL** gerada (será usada na aplicação).

### 2. Criar a Aplicação
- Vá em **Services** > **Create Service** > **App**.
- Configure a origem como seu repositório Git.
- Em **Source**, aponte para o branch principal (`main`).
- O EasyPanel detectará o `Dockerfile` na raiz automaticamente.

### 3. Configurar Variáveis de Ambiente
Em **Environment Variables**, adicione as variáveis documentadas no `.env.production.example`:
- `DATABASE_URL`: URL interna do PostgreSQL do EasyPanel.
- `DB_HOST`: O nome do serviço do banco de dados (ex: `postgres`).
- `DB_PORT`: A porta interna do banco de dados (ex: `5432`).
- `AUTH_SECRET`: Chave aleatória robusta.
- `AUTH_URL`: Seu domínio final (ex: `https://ponto.seusite.com`).
- `NEXT_PUBLIC_APP_URL`: Mesma URL do `AUTH_URL`.

### 4. Configurar Domínio e SSL
- Em **Domains**, adicione seu domínio.
- O EasyPanel (via Caddy) gerará o SSL automaticamente.

---

## 🛠️ Comandos Pós-Deploy (Primeiro Deploy)

Após o container subir pela primeira vez, execute os comandos abaixo no **Terminal** do serviço no EasyPanel:

### 1. Criar a Sequence de Pedidos
O sistema utiliza uma sequence do PostgreSQL para gerar códigos como `PED-0001`. Execute:
```bash
npx prisma db execute --stdin <<SQL
CREATE SEQUENCE IF NOT EXISTS pedido_seq START 1;
SQL
```

### 2. Rodar o Seed do Admin
Para criar o usuário administrador padrão:
```bash
npx prisma db seed
```

---

## 💾 Configurando Backup Automático

O `scripts/backup.sh` já está pronto no container. Para automatizar:
1. Vá em **Storage** > **Mounts**.
2. Crie um mount de diretório: `/backups` (Host) -> `/backups` (Container).
3. Vá em **App** > **Cron Jobs** e adicione:
   - **Command**: `/bin/sh /app/scripts/backup.sh`
   - **Cron Expression**: `0 0 * * *` (Todo dia à meia-noite).

---

## 🔍 Troubleshooting (Erros Comuns)

### 1. O Container não sobe (CrashLoop)
- **Causa**: O script `start.sh` falha no `npx prisma migrate deploy`.
- **Solução**: Verifique os logs. Se o banco não estiver acessível, a migração falhará e o container não iniciará (por segurança).

### 2. Erro "Banco não conecta"
- **Causa**: URL do banco incorreta ou rede interna bloqueada.
- **Solução**: Use a URL interna fornecida pelo EasyPanel (ex: `postgres:5432`) em vez de IPs externos.

### 3. SSE (Server-Sent Events) não funciona
- **Causa**: Proxy reverso (Caddy/Nginx) cortando a conexão por timeout ou falta de headers.
- **Solução**: Garanta que o EasyPanel não esteja com "Buffer response" ativado. SSE requer streaming direto. O Next.js 14 standalone lida bem com isso se os headers `Cache-Control: no-cache` e `Connection: keep-alive` forem enviados.

---

## 🔄 Rollback
Se o deploy falhar ou apresentar bugs graves:
- No EasyPanel, vá em **Deployments**.
- Selecione uma versão anterior funcional e clique em **Rollback**.
- O sistema reverterá a imagem Docker instantaneamente.
