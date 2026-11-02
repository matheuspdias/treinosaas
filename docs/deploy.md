# Deploy (DigitalOcean)

Começo: um Droplet (2 GB, ~US$ 12/mês) com Docker rodando tudo, inclusive o Postgres. Depois o banco pode ir para
o Managed Postgres (~US$ 15/mês) trocando só `DB_HOST`/`DB_PORT`/`DB_SSLMODE=require` no `.env`.

## Painel + API (droplet)

1. Droplet Ubuntu com Docker; aponte `painel.seudominio.com.br` para o IP.
2. `git clone` do repositório; `cp backend/.env.example backend/.env` e ajuste:
   `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://painel.seudominio.com.br`,
   `PWA_URL=https://app.seudominio.com.br`, `DB_PASSWORD` forte (o mesmo no compose), `SESSION_SECURE_COOKIE=true`.
3. `make build && make up`, depois:
   `make composer c="install --no-dev -o"`, `make artisan c="key:generate"`, `make artisan c="migrate --force"`,
   `make panel-install && make panel-build`, `make artisan c="optimize"`.
4. HTTPS: Caddy ou nginx + certbot na frente do nginx do compose (porta 8010). Não exponha 5433/6380 no firewall.
5. Backup do banco: `docker compose exec postgres pg_dump -U treinosaas treinosaas | gzip > backup.sql.gz`
   num cron diário, copiado para fora do droplet (Spaces). Ou os backups automáticos do Managed Postgres.
6. Primeira academia: `make artisan c='academy:create "Nome" --owner-email=...'`.

## App do aluno (Vercel)

Projeto Vercel com *Root Directory* `pwa`, variável `VITE_API_URL=https://painel.seudominio.com.br/api`.
O domínio do app precisa estar em `PWA_URL` (CORS). Se mudar o domínio do app em relação ao treinoapp atual,
os dados locais de quem já usava não migram (IndexedDB é por endereço): peça para exportar o backup antes.
