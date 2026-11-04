#!/bin/bash
# Deploy no droplet: ./deploy.sh (na pasta do projeto, com o usuário deploy). Passo a passo em DEPLOY.md.
set -euo pipefail
cd "$(dirname "$0")"

# O projeto é do usuário deploy (uid 1000, o mesmo dos containers). Rodado como root
# (ex.: console web da DigitalOcean), troca para ele em vez de criar arquivos do root.
if [ "$(id -u)" -eq 0 ]; then
    exec su deploy -c "$PWD/deploy.sh"
fi

COMPOSE="docker compose -f docker-compose.prod.yml --env-file backend/.env"
NODE="docker run --rm -u 1000:1000 -v $PWD:/workspace -w /workspace node:22-bookworm-slim sh -c"
APP_URL=$(grep -E '^APP_URL=' backend/.env | cut -d= -f2- | tr -d '"')

echo "==> Atualizando código..."
git pull origin main

echo "==> Buildando o painel e a landing..."
$NODE "cd backend && npm ci --no-audit --no-fund && npm run build"

echo "==> Buildando o app do aluno (API em $APP_URL/api)..."
echo "VITE_API_URL=$APP_URL/api" > pwa/.env.production.local
$NODE "cd pwa && npm ci --no-audit --no-fund && npm run build"

echo "==> Subindo containers..."
$COMPOSE up -d --build --remove-orphans

echo "==> Instalando dependências PHP..."
$COMPOSE exec -T app composer install --no-dev --optimize-autoloader --no-interaction

if ! grep -qE '^APP_KEY=.+' backend/.env; then
    echo "==> Gerando APP_KEY (primeiro deploy)..."
    $COMPOSE exec -T app php artisan key:generate --force
fi

echo "==> Rodando migrations..."
$COMPOSE exec -T app php artisan migrate --force

if [ ! -L backend/public/storage ]; then
    $COMPOSE exec -T app php artisan storage:link
fi

echo "==> Otimizando..."
$COMPOSE exec -T app php artisan optimize

echo "==> Recarregando nginx..."
$COMPOSE exec -T nginx nginx -s reload

echo "==> Deploy concluído!"
