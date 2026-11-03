# API do app do aluno

Base: `{API_URL}/api/student` (dev: `http://localhost:8010/api/student`). JSON em **camelCase** nos dois sentidos.
Autenticação: `Authorization: Bearer <token>` (token do aparelho, Sanctum). CORS liberado só para `PWA_URL`.

Erros de validação: `422 { message, errors: { campo: [mensagem] } }` (mensagens em pt-BR, prontas para exibir).
Sessão inválida: `401 { code: 'unauthenticated' | 'inactive', message }`. Em `inactive` o aluno foi inativado
(ou a academia desativada): o app volta para a tela de entrada e **mantém** os dados locais.
Academia suspensa (pagamento): `403 { code: 'academy_suspended', message }` em todas as rotas autenticadas, menos
`/auth/logout`. O token **continua válido**: o app mostra a tela de bloqueio (guardada para valer offline) e volta
sozinho quando a academia é reativada.
Limite de requisições: `429`.

## App da academia (público)

| Método | Rota | Resposta |
|---|---|---|
| GET | `/api/academies/{slug}` | `{ slug, name, appName, brandColor, iconUrl }` (404 se não existe ou foi desativada) |
| GET | `/api/academies/{slug}/manifest.webmanifest` | manifest instalável (`start_url`/`scope` = `PWA_URL/{slug}/`) |

Só a marca: nada de alunos, equipe ou situação da assinatura.

## Login

Todas as rotas de login aceitam `academy` (slug): o app de cada academia só procura o aluno nela.


| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/auth/lookup` | `{ phone }` | `{ next, academies }` |
| POST | `/auth/first-access` | `{ phone, academyId?, pin, device?, acceptPrivacy: true }` | `201 Session` |
| POST | `/auth/login` | `{ phone, academyId?, pin, device? }` | `200 Session` |
| POST | `/auth/logout` | – | `204` |
| PUT | `/pin` | `{ currentPin, pin }` | `200` |

- `next`: `login` (já tem PIN) · `first_access` (pode criar o PIN agora) · `blocked` (prazo do primeiro acesso
  acabou: falar com a academia) · `suspended` (academia suspensa) · `inactive` (aluno inativado) · `not_found` ·
  `choose_academy` (mesmo celular em mais de uma academia; `academies`
  traz `[{ id, name, next }]` e o app envia `academyId` depois).
- PIN: 4 a 6 dígitos; no primeiro acesso recusa sequências e repetidos (`1234`, `1111`).
- 5 PINs errados bloqueiam o aluno por 15 min (mensagem no erro de `pin`).
- `Session = { token, expiresAt, student: { id, name, phoneMasked }, academy: { id, name } }`.
  O token vale 180 dias e é **renovado a cada uso**: quem usa o app não precisa entrar de novo.

## Dados (autenticado)

| Método | Rota | Resposta |
|---|---|---|
| GET | `/me` | `{ student, academy }` |
| GET | `/programs` | `{ programs: Program[], syncedAt }` |
| POST | `/programs/{id}/seen` | `204` (aluno viu o treino novo/atualizado) |
| POST | `/workouts` | `{ accepted: string[], rejected: string[] }` |
| GET | `/notices` | `{ notices: [{ id, title, body, pinned, publishedAt, expiresAt }] }` |
| GET | `/assessments` | `{ assessments: [{ id, assessedOn, weightKg, heightCm, bodyFatPct, measurementsCm, notes }] }` |

```ts
type Program = {
  id: string; name: string; notes: string | null; author: string | null
  startsOn: string | null; expiresOn: string | null; expired: boolean
  isNew: boolean            // criado ou alterado pelo instrutor e ainda não visto no app
  updatedAt: string
  plans: { id: string; name: string; color: PlanColor; position: number
    exercises: { id: string; exercise: { source: 'catalog'; id: string }; exerciseName: string
      sets: number; repMin: number; repMax: number; loadKg: number; restSec: number; incrementKg: number
      notes: string /* observação do professor */ }[] }[]
}
```

`GET /programs` devolve **todos** os treinos ativos do aluno: o app substitui as fichas da academia pelo que vier
(ficha que sumiu = treino encerrado pela academia).

### POST /workouts

Corpo: `{ sessions: Session[] }` (até 50), no formato `Session` do app: `id` (UUID gerado no aparelho), `planId`,
`planName`, `startedAt`, `finishedAt`, `exercises[]: { planExerciseId?, exercise: { source, id }, exerciseName,
sets[]: { weightKg, reps, isWarmup, completedAt? } }`. Séries sem `completedAt` são ignoradas.

Idempotente: reenviar um treino já recebido devolve o id em `accepted` de novo. O app remove da fila tudo o que
vier em `accepted` e `rejected` (`rejected` = id já usado por outro aluno; não adianta reenviar).
