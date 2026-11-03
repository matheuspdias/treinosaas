# Imagens da landing

Os prints (`backend/public/landing/img/app-*`, `painel-*`), a prévia do link (`og.jpg`) e os ícones são gerados
com o Chromium do Playwright, a partir do app rodando com os dados de demonstração.

**Se mudar o nome do produto** (`LANDING_APP_NAME`), troque também o texto em `og.html` e gere a prévia de novo:
o nome está desenhado na imagem.

```bash
make up && make fresh && make artisan c=storage:link && make panel-build
make pwa-dev   # em outro terminal (app do aluno em :5174)

cd scripts/landing
docker run --rm --network host -e HOME=/tmp -v "$PWD":/work -w /work \
  -v "$PWD/../../backend/public/landing/img":/out -v "$PWD/../../backend/public":/pub \
  mcr.microsoft.com/playwright:v1.56.1-noble sh -c \
  "npm i -s playwright@1.56.1 >/dev/null && node landing-shots.mjs && node og-e-icones.mjs && chown -R $(id -u):$(id -g) /out /pub/landing"
```

- `landing-shots.mjs`: aplica a marca amarela (logo `logo-demo.svg`) na Academia Demo pelo painel, cria um histórico
  de exemplo no celular da Ana (o app guarda os treinos no aparelho) e tira os prints em 390/520/780 px.
- `og-e-icones.mjs`: `og.jpg` (1200×630), `favicon-32.png` e `apple-touch-icon.png` a partir de `favicon.svg`.
- `webp.mjs`: converte as fotos do Pexels (ver `CREDITS.md`) para WebP em preto e branco. Só precisa rodar se trocar as fotos.
