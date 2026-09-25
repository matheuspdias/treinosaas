# TreinoApp

PWA de registro de treinos de musculação, em português, que funciona 100% offline. Mobile-first, pensado para usar com uma mão entre as séries.

- **Fichas A, B, C…** com sequência automática, reordenação por arrastar e modelos prontos (ABC, ABCD, Full Body, Upper/Lower).
- **Modo treino**: um exercício por vez, com animação do movimento, séries pré-preenchidas com o último treino, aquecimento, descanso automático (vibração, som e notificação) e tela sempre acesa.
- **Progresso**: histórico por exercício (carga, 1RM estimado e volume), recordes pessoais, sugestão de aumento de carga (dupla progressão), calendário, sequência de semanas, estatísticas por grupo muscular, peso e medidas.
- **Compartilhamento**: ficha por link ou QR code (sem servidor) e como imagem para WhatsApp/Instagram.
- **Seus dados ficam no aparelho** (IndexedDB), com backup e restauração em JSON.

## Rodando localmente

Requisitos: Node 20+ e npm.

```bash
npm install
npm run dev
```

### Testar no celular (mesma rede Wi-Fi)

```bash
npm run build
npm run preview -- --host
```

O terminal mostra um endereço `Network: http://192.168.x.x:4173`. Abra no navegador do celular.

- O **service worker só roda no build** (`preview`). No `npm run dev -- --host` a interface funciona, mas sem modo offline.
- Pela rede local (HTTP), o navegador considera a página insegura: **instalar o app, notificações e tela sempre acesa só funcionam em HTTPS** (ou `localhost`). Para testar isso no celular, faça o deploy na Vercel (abaixo) ou use um túnel HTTPS, por exemplo `npx cloudflared tunnel --url http://localhost:4173`.
- No WSL2 o IP da rede é o do Windows: pode ser preciso liberar a porta 4173 no firewall e criar um `netsh interface portproxy` para o IP do WSL.

## Deploy na Vercel

1. Suba o repositório para o GitHub (ou GitLab/Bitbucket).
2. Em [vercel.com](https://vercel.com), clique em **Add New → Project** e importe o repositório.
3. A Vercel detecta o Vite sozinha. Confira:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Clique em **Deploy**. Em cerca de um minuto o app fica disponível em `https://<projeto>.vercel.app`, já com HTTPS.
5. Abra o endereço no celular e instale:
   - **Android (Chrome):** menu ⋮ → **Instalar app** (ou o aviso que aparece na tela).
   - **iPhone (Safari):** botão Compartilhar → **Adicionar à Tela de Início**.

Detalhes que já estão configurados:

- `vercel.json` faz todas as rotas do app (`/fichas`, `/progresso`…) caírem no `index.html` e impede que o `sw.js` fique em cache, para as atualizações chegarem na hora. Quando sai uma versão nova, o app mostra "Nova versão disponível".
- A imagem de prévia de links (`og:image`) usa o domínio de produção da Vercel automaticamente. Em outro provedor, defina `SITE_URL=https://seu-dominio` no build.
- **Domínio próprio:** em **Settings → Domains**. Depois de trocar o domínio, os dados de quem já usava o app no endereço antigo não migram sozinhos (o IndexedDB é por endereço). Peça para exportar o backup antes.
- **Opcional:** para ativar a futura integração com a API ExerciseDB, defina `VITE_EXERCISEDB_API_KEY` em **Settings → Environment Variables** e faça um novo deploy.

## Scripts

| Comando                                           | O que faz                                                      |
| ------------------------------------------------- | -------------------------------------------------------------- |
| `npm run dev`                                     | servidor de desenvolvimento                                    |
| `npm run build`                                   | typecheck + build de produção em `dist/`                       |
| `npm run preview`                                 | serve o build (com service worker)                             |
| `npm run lint` / `npm run typecheck` / `npm test` | qualidade                                                      |
| `npm run catalog`                                 | regenera o catálogo de exercícios a partir do free-exercise-db |
| `npm run assets`                                  | regenera ícones e splash screens a partir de `public/logo.svg` |

## Qualidade (medida em 25/09/2026)

- 140+ testes (Vitest) cobrindo sequência de fichas, volume, 1RM, recordes, progressão, calendário, estatísticas, backup/importação, migrations, compartilhamento por link e busca.
- Auditoria automática de acessibilidade (axe) em todas as telas, nos temas claro e escuro: nenhuma violação WCAG 2.1 A/AA.
- Lighthouse (mobile, primeiro acesso sem cache): Performance 92–93 na tela inicial e 99–100 nas demais; Acessibilidade 100; Boas Práticas 100; SEO 100. O Lighthouse não tem mais categoria "PWA" desde a v12; os critérios de instalação (manifest, ícones, service worker, HTTPS) estão atendidos.

## Arquitetura

Veja [CLAUDE.md](CLAUDE.md) para as camadas, convenções e regras do projeto.

## Créditos

Exercícios e imagens: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (The Unlicense, domínio público).
