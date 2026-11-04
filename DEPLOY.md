# Deploy num droplet da DigitalOcean

Tudo roda num droplet só, com Docker: nginx, PHP, Postgres e Redis. Os arquivos são `docker-compose.prod.yml`, `docker/nginx/prod.conf.template`, `deploy.sh` e `scripts/deploy/`.

| O quê | Endereço |
|---|---|
| Landing, painel e API | `https://treinobox.com.br` (o `www.` redireciona para cá) |
| App do aluno | `https://app.treinobox.com.br/{slug-da-academia}/` |

O app do aluno **precisa de HTTPS**: o modo offline, a instalação no celular e a criação dos treinos só funcionam em conexão segura. O certificado é do Let's Encrypt (gratuito, renovado sozinho).

## 1. Criar o droplet

No painel da DigitalOcean → **Create → Droplets**:

- **Imagem:** Ubuntu 24.04 LTS.
- **Tamanho:** Basic, Regular, **2 GB / 1 CPU** (US$ 12/mês). O de 1 GB funciona com o swap do passo 2, mas o build fica lento.
- **Região:** New York (NYC3 ou NYC1), a mais próxima do Brasil. Sem plano Basic disponível, use Atlanta (ATL1) ou Toronto (TOR1).
- **Autenticação:** **SSH Key** (adicione a sua chave pública, `~/.ssh/id_ed25519.pub` ou `id_rsa.pub`). Evite senha.
- Opcional: marque **Backups** (+20% no preço): cópia semanal do droplet inteiro, banco incluído.

Anote o IP do droplet.

## 1.1 Apontar o domínio (DNS)

No Registro.br → **treinobox.com.br → DNS → Editar zona** (se pedir, primeiro "Utilizar DNS do Registro.br"). Crie três registros:

| Tipo | Nome | Valor |
|---|---|---|
| A | *(vazio, o próprio domínio)* | IP do droplet |
| A | `www` | IP do droplet |
| A | `app` | IP do droplet |

Pode levar de alguns minutos a algumas horas para propagar. Para conferir, no seu computador: `ping treinobox.com.br`, `ping www.treinobox.com.br` e `ping app.treinobox.com.br` devem responder com o IP do droplet. O certificado (passo 5) só funciona depois disso.

## 2. Preparar o servidor (uma vez, como root)

No seu computador:

```bash
ssh root@SEU_IP
```

No droplet:

```bash
curl -fsSL https://raw.githubusercontent.com/matheuspdias/treinosaas/main/scripts/deploy/preparar-servidor.sh -o preparar.sh
bash preparar.sh
```

Se o repositório for privado, o `curl` não baixa: copie o arquivo do seu computador com `scp scripts/deploy/preparar-servidor.sh root@SEU_IP:preparar.sh` e rode `bash preparar.sh`.

O script instala o Docker, cria o usuário `deploy` (uid 1000, o mesmo dos containers), cria 2 GB de swap, libera só as portas 22, 80 e 443 no firewall e cria `/opt/treinosaas`.

## 3. Clonar o projeto (como deploy)

```bash
ssh deploy@SEU_IP
```

Repositório privado: crie uma chave só para o servidor e cadastre no GitHub em **Settings → Deploy keys → Add deploy key** (somente leitura):

```bash
ssh-keygen -t ed25519 -C "treinosaas-droplet" -N "" -f ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub   # cole no GitHub
```

Depois:

```bash
git clone git@github.com:matheuspdias/treinosaas.git /opt/treinosaas
cd /opt/treinosaas
```

## 4. Configurar o `.env` de produção

Ainda no droplet, em `/opt/treinosaas`. Troque só o número do WhatsApp:

```bash
HOST=treinobox.com.br

cat > backend/.env <<EOF
APP_NAME=TreinoBox
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://$HOST
APP_LOCALE=pt_BR
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=pt_BR

LOG_CHANNEL=stack
LOG_STACK=daily
LOG_LEVEL=warning

DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=treinosaas
DB_USERNAME=treinosaas
DB_PASSWORD=$(openssl rand -hex 24)

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true

QUEUE_CONNECTION=redis
CACHE_STORE=redis
REDIS_CLIENT=phpredis
REDIS_HOST=redis
REDIS_PORT=6379

MAIL_MAILER=log

# App do aluno e hosts do nginx
PWA_URL=https://app.$HOST
API_HOST=$HOST
PWA_HOST=app.$HOST

STUDENT_FIRST_ACCESS_HOURS=48
STUDENT_TOKEN_DAYS=180

LANDING_APP_NAME=TreinoBox
LANDING_WHATSAPP=5511999999999
LANDING_SHOW_PRICING=false
EOF

chmod 600 backend/.env
```

A senha do banco é gerada aleatoriamente. Se for editar depois, não use `$` em nenhum valor (o Docker Compose interpreta).

## 5. Gerar o certificado HTTPS (uma vez, como root)

O nginx só sobe com o certificado, então ele vem antes do primeiro deploy. Em outro terminal:

```bash
ssh root@SEU_IP
bash /opt/treinosaas/scripts/deploy/certificado.sh seu@email.com
```

O e-mail recebe avisos do Let's Encrypt. Se der erro de DNS, o domínio ainda não propagou (passo 1.1): espere e rode de novo. O script também agenda a renovação automática (todo dia às 3h, sem derrubar o site).

## 6. Primeiro deploy (como deploy)

```bash
cd /opt/treinosaas
./deploy.sh
```

Ele builda o painel e o app do aluno, sobe os containers, instala o PHP, gera o `APP_KEY`, roda as migrations e otimiza. A primeira vez demora uns 10 minutos (download das imagens e build).

## 7. Criar a primeira academia

```bash
docker compose -f docker-compose.prod.yml --env-file backend/.env exec app \
  php artisan academy:create "Nome da Academia" --owner-email=dono@email.com --owner-name="Nome do Dono"
```

Ele mostra o slug e uma **senha provisória**. O dono entra em `https://treinobox.com.br/login` e troca a senha em Configurações.

Não rode `db:seed` em produção: o seeder cria as academias de demonstração com senha `password`.

## 8. Conferir

- `https://treinobox.com.br/` abre a landing (e `https://www.treinobox.com.br` redireciona para ela).
- `https://treinobox.com.br/login` abre o painel.
- No painel: **Configurações → App** (nome, cor, logo). Cadastre um aluno e use o botão de WhatsApp da ficha dele para mandar o link.
- No celular, o link `https://app.treinobox.com.br/{slug}/` mostra a tela de instalação. Instale, abra pelo ícone e entre com o celular e o PIN.

## Deploys seguintes

No seu computador: `git push`. No droplet:

```bash
ssh deploy@SEU_IP
cd /opt/treinosaas && ./deploy.sh
```

Mudou algo no `backend/.env`? Rode o `./deploy.sh` (ele recria o cache de configuração).

## Comandos úteis

```bash
alias dc='docker compose -f docker-compose.prod.yml --env-file backend/.env'   # coloque no ~/.bashrc

dc ps                                         # containers no ar
dc logs -f nginx app                          # logs do nginx e do PHP
tail -f backend/storage/logs/laravel-*.log    # erros do Laravel
dc exec app php artisan academy:list          # academias
dc exec app php artisan academy:suspend slug --reason="Pagamento em atraso"
dc exec app php artisan academy:reactivate slug
```

Backup manual do banco:

```bash
dc exec -T postgres pg_dump -U treinosaas treinosaas | gzip > ~/backup-$(date +%F).sql.gz
```

## Limitações atuais

- **E-mail:** `MAIL_MAILER=log`, então "Esqueci minha senha" do painel não envia nada. Para isso, configure um SMTP (ex.: Brevo, Resend) nas variáveis `MAIL_*`. Enquanto isso, a senha de um dono pode ser trocada pelo `tinker`.
- **Endereço do app:** o app instalado fica preso ao endereço `app.treinobox.com.br`. Se um dia ele mudar, quem já instalou precisa instalar de novo.
