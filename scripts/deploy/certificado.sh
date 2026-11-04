#!/bin/bash
# Gera o certificado HTTPS (Let's Encrypt) para API_HOST, www.API_HOST e PWA_HOST de backend/.env.
# O DNS dos três nomes precisa já apontar para o droplet.
# Uso, como root: bash /opt/treinosaas/scripts/deploy/certificado.sh seu@email.com
# Roda antes do primeiro deploy (o nginx não sobe sem certificado) e sempre que mudar os hosts.
set -euo pipefail
cd "$(dirname "$0")/../.."

EMAIL=${1:?Informe o e-mail: bash scripts/deploy/certificado.sh seu@email.com}
env_value() { grep -E "^$1=" backend/.env | cut -d= -f2- | tr -d '"'; }
API_HOST=$(env_value API_HOST)
PWA_HOST=$(env_value PWA_HOST)

# O certbot precisa da porta 80 livre por alguns segundos.
docker stop treinosaas_nginx 2>/dev/null || true

docker run --rm -p 80:80 -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot certonly \
    --standalone --non-interactive --agree-tos -m "$EMAIL" \
    --cert-name "$API_HOST" -d "$API_HOST" -d "www.$API_HOST" -d "$PWA_HOST" --expand

docker start treinosaas_nginx 2>/dev/null || true

# Renovação automática: todo dia às 3h, pelo nginx já no ar (sem derrubar o site).
CRON='0 3 * * * docker run --rm -v /etc/letsencrypt:/etc/letsencrypt -v /var/www/certbot:/var/www/certbot certbot/certbot renew --webroot -w /var/www/certbot --quiet && docker exec treinosaas_nginx nginx -s reload'
( crontab -l 2>/dev/null | grep -v 'certbot/certbot renew' ; echo "$CRON" ) | crontab -

echo "==> Certificado pronto para $API_HOST, www.$API_HOST e $PWA_HOST (renovação automática agendada)."
