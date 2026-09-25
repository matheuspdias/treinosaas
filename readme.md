# TreinoApp

PWA de registro de treinos de musculação, em português, 100% offline. Mobile-first, pensado para usar com uma mão entre as séries.

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

O terminal mostra um endereço `Network: http://192.168.x.x:4173`. Abra esse endereço no navegador do celular.

- O **service worker só roda no build** (`preview`). No `npm run dev -- --host` a interface funciona, mas sem modo offline.
- Em HTTP pela rede local, o navegador trata a página como insegura: **instalar o app, notificações e Wake Lock só funcionam em HTTPS** (ou `localhost`). Para testar isso no celular, faça deploy na Vercel (abaixo) ou use um túnel HTTPS (ex.: `npx cloudflared tunnel --url http://localhost:4173`).
- No WSL2, o IP da rede é o do Windows: pode ser preciso liberar a porta 4173 no firewall e fazer `netsh interface portproxy` para o IP do WSL.

## Scripts

| Comando                                           | O que faz                                                      |
| ------------------------------------------------- | -------------------------------------------------------------- |
| `npm run dev`                                     | servidor de desenvolvimento                                    |
| `npm run build`                                   | typecheck + build de produção em `dist/`                       |
| `npm run preview`                                 | serve o build (com service worker)                             |
| `npm run lint` / `npm run typecheck` / `npm test` | qualidade                                                      |
| `npm run catalog`                                 | regenera o catálogo de exercícios a partir do free-exercise-db |

## Deploy na Vercel

1. Suba o repositório para o GitHub.
2. Na Vercel: **Add New → Project**, importe o repositório. O framework "Vite" é detectado sozinho (build `npm run build`, saída `dist`).
3. Deploy. O `vercel.json` já cuida das rotas do app e do cache do service worker.
4. Opcional: para ativar a integração futura com a API ExerciseDB, defina `VITE_EXERCISEDB_API_KEY` em **Settings → Environment Variables**.

## Arquitetura

Veja [CLAUDE.md](CLAUDE.md) para as camadas, convenções e regras do projeto.

## Créditos

Exercícios e imagens: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (The Unlicense, domínio público).
