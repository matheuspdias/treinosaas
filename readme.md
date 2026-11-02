# TreinoSaaS

TreinoApp para academias: a PWA de treinos (offline) + painel da academia + API.

```
backend/   Laravel 13 (controller → service → repository) + painel Inertia/React + API do aluno (Sanctum)
pwa/       app do aluno (Vite/React, offline-first, IndexedDB), importado do treinoapp com histórico
docker/    imagens e configs do ambiente (php-fpm 8.4, nginx, postgres 16, redis)
```

## Rodando (tudo pelo Docker)

```bash
make build && make up
cp backend/.env.example backend/.env      # primeira vez
make artisan c="key:generate"             # primeira vez
make fresh                                # migra e cria dados de demonstração
make panel-install && make panel-build    # assets do painel (ou make panel-dev para HMR)
```

- Painel: http://localhost:8010 (`dono@demo.test` / `password`, `instrutor@demo.test` / `password`)
- Postgres: `localhost:5433` (treinosaas / secret), Redis: `localhost:6380`
- Testes: `make test` (banco `treinosaas_test`, criado pelo `docker/postgres/init.sql`)

Academia nova (não existe cadastro público):

```bash
make artisan c='academy:create "Academia Força Total" --owner-email=dono@forca.com --owner-name="Fulano"'
```

## Multi-tenant

- Toda entidade de academia usa o trait `BelongsToAcademy`: consultas filtradas pela academia atual e gravação
  conferida. Sem academia no contexto, a consulta **lança exceção** (falha fechada).
- A academia atual (`App\Tenancy\TenantContext`) é definida só pelos middlewares, a partir de quem está logado
  (`tenant` para a equipe; o aluno pelo token). Nunca a partir de dado da requisição.
- Remover o scope só em repositório, em método com nome explícito (ex.: `findInAnyAcademyByPhone`, usado no login).

## Papéis

`owner` (tudo), `admin` (tudo menos dados da academia/equipe), `instructor` (vê alunos, cria e atribui treinos,
vê histórico e avaliações). Permissões em `App\Enums\Ability`, cada uma é um Gate.
