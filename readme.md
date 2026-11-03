# TreinoSaaS

TreinoApp para academias: o app de treinos do aluno (PWA offline) + painel da academia + API.

```
backend/   Laravel 13 (controller → service → repository) + painel Inertia/React + API do aluno (Sanctum)
pwa/       app do aluno (Vite/React, offline-first, IndexedDB). Um app por academia em /{slug}/ (nome, cor e ícone dela)
docker/    php-fpm 8.4, nginx, postgres 16, redis
docs/      contrato da API do aluno (api-aluno.md) e deploy (deploy.md)
```

## Rodando (tudo pelo Docker)

```bash
make build && make up
cp backend/.env.example backend/.env && make artisan c="key:generate"   # primeira vez
make fresh                                  # migra e cria os dados de demonstração
make artisan c=storage:link                 # ícones dos apps das academias (primeira vez)
make panel-install && make panel-build      # painel (ou make panel-dev para HMR)
make pwa-install
echo "VITE_API_URL=http://localhost:8010/api" > pwa/.env.local
make pwa-dev                                # app da Academia Demo em http://localhost:5174/academia-demo/
```

| | Endereço | Acesso |
|---|---|---|
| Painel | http://localhost:8010 | `dono@demo.test` / `password` · `instrutor@demo.test` / `password` · `dono@outra.test` / `password` (outra academia) |
| App do aluno | http://localhost:5174/academia-demo/ | Ana Souza `(11) 98765-4321` (primeiro acesso liberado: cria o PIN) |
| Postgres / Redis | `localhost:5433` / `localhost:6380` | treinosaas / secret |

Qualidade: `make test` (backend, 111 testes) · `make pwa-check` (PWA, 205 testes) · painel: `docker compose run --rm node sh -c "cd backend && npm run lint && npm run typecheck"`.

Academia nova (não existe cadastro público):

```bash
make artisan c='academy:create "Academia Força Total" --owner-email=dono@forca.com --owner-name="Fulano"'
```

Academia sem pagar: suspender bloqueia os alunos no app ("Fale com o dono ou a recepção da academia"). O painel
continua acessível, com um aviso. Ao reativar, os alunos voltam a usar o app sem entrar de novo.

```bash
make artisan c='academy:list'
make artisan c='academy:suspend academia-demo --reason="mensalidade de outubro"'   # motivo é interno
make artisan c='academy:reactivate academia-demo'
```

## Landing de venda

Em `http://localhost:8010/` (visitante; quem está logado vai para o painel). Blade + CSS/JS próprios, sem React,
para abrir rápido pelo link do WhatsApp. Tudo o que muda fica em `backend/config/landing.php` / `.env`:

- `LANDING_APP_NAME`: nome do produto em toda a página e nas mensagens do WhatsApp;
- `LANDING_WHATSAPP`: número dos botões (`5511912345678`); vazio, o WhatsApp abre para escolher o contato;
- `LANDING_SHOW_PRICING`: mostra a seção de planos (valores em `config/landing.php`, hoje "R$ XX"). Desligada,
  ela some também do menu.

Prints, prévia do link e ícones: `scripts/landing/README.md`. Fotos e fontes: `CREDITS.md`.

## Como testar cada fluxo

**Dono (painel, celular ou computador)**
1. Entre como `dono@demo.test`. Início: alunos ativos, treinos na semana, fichas vencidas, gráfico de 14 dias,
   fichas vencendo e alunos sumidos (filtro 7/14/30 dias; Diego aparece nos dois).
2. Alunos → Novo aluno: cadastre com celular em qualquer formato (`11 9 1234-5678`). Repetir o celular dá erro;
   celular inválido também. A lista mostra o celular mascarado; busca sem acento ("joao" acha "João").
3. Ficha do aluno (Ana): acesso ao app (PIN criado em…, Resetar PIN), treinos, frequência de 12 semanas,
   evolução de cargas por exercício (gráfico + tabela), últimos treinos e avaliações físicas (Nova avaliação).
4. Inativar: o aluno sai do app na hora. Excluir dados (LGPD): pede "ANONIMIZAR" e apaga nome/celular/avaliações.
5. Treinos → Novo modelo: fichas A/B/C com cor, exercícios do catálogo (busca + grupo muscular, com imagem),
   séries, reps, carga, descanso e observação do professor. "Enviar para alunos": escolhe vários, validade
   (4/6/8/12 semanas) e se substitui o treino atual. Cada aluno recebe a própria cópia.
6. Na ficha do aluno → Novo treino → do zero ou a partir de um modelo (treino dedicado). Editar um treino de aluno
   faz o app mostrar "Seu treino foi atualizado". "Salvar como modelo" reaproveita o treino de um aluno.
7. Avisos: publique (com agendamento, validade e fixar no topo). Aparece no app do aluno.
8. Isolamento: entre como `dono@outra.test`: só a aluna Carla. Abrir a URL de um aluno da Demo dá 404.

**Instrutor**: entre como `instrutor@demo.test`. Vê alunos (celular mascarado), cria e envia treinos, registra
avaliações e vê o histórico. Não cadastra/inativa alunos nem publica avisos (menu e servidor bloqueiam: 403).

**App de cada academia (dono)**
1. Ajustes → App do aluno: nome do app, cor (ajustada sozinha para ter contraste no tema claro e escuro) e logo.
   O ícone é recortado no navegador (512×512, versão normal e "maskable" para Android) com fundo branco, preto
   ou na cor da academia. Prévia do ícone na tela inicial. Só o dono vê essa tela (admin/instrutor: 403).
2. O link `http://localhost:5174/academia-demo/` aparece lá (copiar/abrir) e na ficha do aluno que ainda não
   entrou há "Enviar link pelo WhatsApp" com o link e a mensagem prontos.
3. Ao abrir o link, o app já vem com o nome, a cor e o ícone da academia, e "Instalar"/"Adicionar à tela de início"
   cria o app da academia (manifest em `/api/academies/{slug}/manifest.webmanifest`).
4. `http://localhost:5174/` (sem academia) mostra "Abra pelo link da sua academia"; slug inexistente, "Academia não
   encontrada". O app da Academia Demo não aceita a Carla (`(21) 98765-4321`), que é da outra academia.

**Aluno (PWA)**
1. Abra `http://localhost:5174/academia-demo/`: a única tela é "Entrar" (não existe uso sem academia).
   Informe `(11) 98765-4321`. Um celular não cadastrado nesta academia mostra "Celular não encontrado".
2. Primeiro acesso: crie o PIN (1234/1111 são recusados) e aceite o aviso de privacidade. Depois disso o aparelho
   fica conectado (token de 180 dias renovado a cada uso). PIN errado 5× bloqueia por 15 min.
3. Fichas: seção "Treino da academia" (programa, instrutor, validade), só leitura, com as observações do professor.
   As fichas do próprio aluno continuam editáveis como sempre.
4. Início: "Seu instrutor tem um treino novo!", próximo treino seguindo a sequência da academia, mural de avisos.
5. Faça e finalize um treino de ficha da academia → aparece no painel (cargas, frequência, último treino).
   Offline (modo avião) o treino fica na fila e é enviado sozinho quando a internet volta.
6. Progresso → Peso e medidas: "Avaliações da academia".
7. Suspenda a academia (`academy:suspend academia-demo`) e reabra o app: tela "Acesso suspenso", que continua
   mesmo offline. Treinos feitos antes ficam na fila. `academy:reactivate` + "Tentar de novo" libera tudo.
8. Sem internet o app funciona por até 7 dias desde a última confirmação com a academia; depois pede conexão.
9. No painel, inative a Ana: o app volta para a tela de entrada ("Cadastro inativo"), o histórico fica no aparelho.
10. Ajustes → Minha academia → "Sair da academia": volta para a tela de entrada. Cada academia tem dados próprios
    no aparelho (um banco por app), então o mesmo celular pode usar o app de duas academias sem misturar nada.

## Multi-tenant e segurança

- Toda entidade de academia usa `BelongsToAcademy`: consultas filtradas pela academia atual e gravação conferida.
  Sem academia no contexto a consulta **lança exceção** (falha fechada). Ids de outra academia → 404.
- A academia atual (`App\Tenancy\TenantContext`) vem só de quem está logado: middleware `tenant` (equipe) e
  `student` (aluno, pelo token). Nunca de dado da requisição.
- Escapes do filtro só em repositório, com nome explícito (`findInAnyAcademyByPhone` no login,
  `ownersOf` na sincronização).
- Papéis: `owner`, `admin` (tudo menos academia/equipe), `instructor`. Cada `App\Enums\Ability` é um Gate e
  toda rota do painel tem `can:`. Testes cobrem cada rota com id de outra academia.
- LGPD: listas com celular mascarado; celular completo só para quem gerencia alunos; API do aluno não devolve o
  celular; nada de telefone/PIN em log; aviso de privacidade no primeiro acesso; anonimização no painel.

## Segundo fator do aluno

Hoje: PIN criado no primeiro acesso, que só fica aberto por 48h depois do cadastro (ou de "Liberar primeiro
acesso"); o painel mostra quando o PIN foi criado. Para trocar por código no WhatsApp: implementar
`App\Services\StudentAuth\OtpSender` (recomendado: WhatsApp Cloud API, template de autenticação, cerca de
US$ 0,03 por código no Brasil; confirmar a tabela atual da Meta) e trocar o binding no `AppServiceProvider`.
