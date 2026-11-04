#!/bin/bash
# Roda UMA vez no droplet novo, como root: curl ... | bash ou bash preparar-servidor.sh
# Instala o Docker, cria o usuário deploy (uid 1000, o mesmo dos containers), swap e firewall.
set -euo pipefail

echo "==> Atualizando o sistema..."
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
apt-get install -y git curl ufw

if ! command -v docker >/dev/null; then
    echo "==> Instalando Docker..."
    curl -fsSL https://get.docker.com | sh
fi

if ! id deploy >/dev/null 2>&1; then
    echo "==> Criando usuário deploy..."
    useradd -m -u 1000 -s /bin/bash -G docker deploy
    # Mesmas chaves SSH do root: você entra com ssh deploy@IP.
    mkdir -p /home/deploy/.ssh
    cp /root/.ssh/authorized_keys /home/deploy/.ssh/
    chown -R deploy:deploy /home/deploy/.ssh
    chmod 700 /home/deploy/.ssh
    chmod 600 /home/deploy/.ssh/authorized_keys
fi

# O build do app do aluno usa bastante memória: swap evita travar em droplet de 1-2 GB.
if [ ! -f /swapfile ]; then
    echo "==> Criando swap de 2 GB..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Firewall: SSH, HTTP e HTTPS..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

mkdir -p /opt/treinosaas /var/www/certbot
chown deploy:deploy /opt/treinosaas

echo "==> Servidor pronto. Próximo passo: entrar como deploy (ssh deploy@IP)."
