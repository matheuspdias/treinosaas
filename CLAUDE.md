# TreinoApp: convenções do projeto

PWA de registro de treinos de musculação, offline-first, em pt-BR. Mobile-first, pensado para uso com uma mão entre séries.

## Comandos

```bash
npm run dev            # vite
npm run dev -- --host  # acessar pelo celular na rede local
npm run build          # tsc -b && vite build
npm run preview -- --host  # testar o service worker de verdade (o SW só roda no build)
npm run lint           # eslint
npm run typecheck      # tsc -b --noEmit
npm run test           # vitest run
npm run catalog        # regenera o catálogo de exercícios (scripts/build-catalog.ts)
npx tsx scripts/generate-icons.ts  # regenera os ícones do PWA
```

Antes de qualquer commit de fim de fase: `npm run lint && npm run typecheck && npm run test`, tudo verde.

## Stack

Vite, React, TypeScript strict, Tailwind (tokens próprios), vite-plugin-pwa (Workbox), Dexie (IndexedDB), Zustand, React Router, Recharts, Zod, @dnd-kit, Vitest + Testing Library + fake-indexeddb, ESLint + Prettier. Gerenciador de pacotes: npm.

## Arquitetura em camadas

```
src/
  app/          # bootstrap, rotas, providers, layout, aviso de atualização do PWA
  domain/       # regras de negócio PURAS: tipos, cálculos, sem React, sem Dexie, sem browser APIs
  data/         # persistência: Dexie, migrations, repositórios, backup (Zod)
  catalog/      # catálogo embutido (free-exercise-db), nomes pt-BR, busca
  media/        # provedores de mídia (catálogo, mídia do usuário, YouTube, ExerciseDB futuro)
  features/     # telas e componentes por funcionalidade (plans, workout, exercises, summary, settings...)
  ui/           # design system: componentes genéricos sem regra de negócio
  stores/       # Zustand, SOMENTE estado de UI efêmero
  lib/          # utilitários de plataforma (wake lock, vibração, som, notificação, compressão de imagem)
  templates/    # modelos de treino prontos (ABC, Full Body...), nunca misturados com dados do usuário
```

Regras de dependência (a seta indica "pode importar"):

- `features` → `ui`, `domain`, `data` (só via hooks/repositórios), `media`, `catalog`, `stores`, `lib`
- `data` → `domain`
- `domain` → nada do projeto (só tipos e funções puras). Tudo em `domain/` tem teste.
- `ui` → só utilitários puros de `domain` (formatação/unidades). Nunca `features` nem `data`.
- Componentes nunca acessam `db` (Dexie) diretamente. Sempre via repositório (`data/repositories/*`), consumidos por hooks em `data/hooks/*`.

## Dados

- **Repositórios**: cada entidade tem uma interface (`PlanRepository`, `SessionRepository`, ...) em `data/repositories/types.ts` e uma implementação Dexie. A futura sincronização (Supabase) entra como outra implementação ou decorator, sem tocar nas telas.
- **IDs**: `crypto.randomUUID()`. Nunca IDs autoincrementais (quebram sync).
- **Metadados em toda entidade do usuário**: `createdAt`, `updatedAt` (ISO string) e `deletedAt` opcional (soft delete, pensando em sync).
- **Migrations**: toda mudança de schema cria um novo `db.version(n)` em `data/db/migrations.ts` com `.upgrade()` quando houver transformação de dados, e um teste com fake-indexeddb que abre a versão anterior, grava dados e confere o resultado da migração. Nunca editar uma versão já publicada.
- **Backup**: formato JSON com `formatVersion`, validado por Zod em `data/backup/schema.ts`. Backups antigos passam por `migrateBackup()` antes de importar. Importar sempre pede confirmação antes de substituir.
- **Treino em andamento**: o IndexedDB é a fonte da verdade. Cada série registrada é persistida na hora. Única exceção à regra dos stores: `features/workout/workoutStore.ts` é um cache em memória com escrita imediata (fila serializada) no IndexedDB, para toques rápidos não partirem de estado velho. Antes de finalizar/descartar, `await flushWorkoutWrites()`. Timers guardam o **timestamp absoluto de término** (`restEndsAt`), nunca um contador, para sobreviver a reload e segundo plano.
- **Modelos e exemplos**: ficam em `src/templates/` como código estático. Só viram dados do usuário quando ele escolhe importar um modelo explicitamente.

## Unidades e números

- Internamente, carga é **sempre em kg** (`number`), com nomes terminados em `Kg` (`loadKg`, `incrementKg`).
- Conversão e formatação só na borda, por `domain/units.ts` (`formatWeight`, `parseWeightInput`, `toDisplayUnit`). Nunca escreva "kg" hardcoded em componente.
- Entrada numérica aceita vírgula e ponto (`2,5` e `2.5`). Exibição com `Intl.NumberFormat('pt-BR')`.
- Durações em segundos (`restSec`), datas em ISO string.

## Catálogo de exercícios

- Fonte: free-exercise-db (domínio público), com commit fixado em `scripts/build-catalog.ts`. O script baixa, converte as imagens para WebP reduzido e gera `src/catalog/generated/exercises.json` e `public/exercises/<id>/{0,1}.webp`. Não editar arquivos gerados à mão.
- Nomes pt-BR, sinônimos e grupos musculares traduzidos em `src/catalog/i18n/pt-BR.ts`, indexados pelo `id` do dataset.
- Busca: normalizar com NFD + remoção de diacríticos + lowercase; pesquisar em nome pt-BR, nome em inglês e sinônimos.
- Referência a exercício em fichas e sessões: `ExerciseRef = { source: 'catalog' | 'custom' | 'exercisedb', id: string }`.

## Mídia

- Tudo passa por `MediaProvider` (`media/types.ts`). Provedores: `catalog`, `user` (blob no IndexedDB), `youtube`, e `exercisedb` (ativado por `VITE_EXERCISEDB_API_KEY`). Telas usam `useExerciseMedia(ref)` e nunca montam URL de mídia na mão.
- Imagens enviadas pelo usuário são comprimidas (WebP, lado maior ≤ 1080px) antes de salvar. GIF e vídeo não são recomprimidos, mas têm limite de tamanho.
- Blobs em tabela separada (`mediaBlobs`), nunca embutidos na entidade do exercício. Liberar `URL.createObjectURL` no cleanup.

## UI e acessibilidade

- Todo texto de interface em pt-BR, centralizado por feature em `features/*/strings.ts` quando repetido. Código, nomes de arquivos e identificadores em inglês.
- Alvos de toque com **mínimo 48px** (`min-h-12 min-w-12`). Ações principais do modo treino ficam na metade inferior da tela.
- Nada depende de hover. Todo estado de hover tem equivalente em `active:` e `focus-visible:`.
- Cores só pelos tokens (`bg-surface`, `text-fg`, `text-fg-muted`, `bg-accent`...). Nunca usar cor crua do Tailwind (`bg-blue-500`) nem hex em componente. Tokens em `src/ui/theme/tokens.css` com variantes clara e escura.
- Tema: `system` | `light` | `dark`, aplicado via atributo `data-theme` no `<html>`.
- Animações respeitam `prefers-reduced-motion` (a mídia animada vira imagem estática com botão de play).
- Todo input tem `<label>` associado; todo botão só com ícone tem `aria-label`.

## Estilo de código

- TypeScript strict, sem `any` (use `unknown` + Zod na borda). Sem `enum`: prefira union de strings.
- Componentes em PascalCase (`PlanCard.tsx`), hooks `useX.ts`, demais arquivos camelCase. Um componente exportado por arquivo.
- Exports nomeados; `default` só onde o tooling exige (rotas lazy).
- Import absoluto com alias `@/` para `src/`.
- Testes ao lado do código: `progression.ts` → `progression.test.ts`. Testes que usam IndexedDB com Blob rodam com `// @vitest-environment node` (o Blob do jsdom não sobrevive ao structuredClone).
- Obrigatório testar: sequência de fichas, volume, 1RM (Epley), recordes, progressão, import/export, migrations, busca normalizada, conversão de unidades.

## Fluxo de trabalho

- Uma fase por vez (ver plano no README). Não adiantar funcionalidades de fases futuras, mas não tomar decisões que as bloqueiem.
- Ao fim de cada fase: lint, typecheck, testes, commit, e instruções de teste no celular.
- Commits em português, no imperativo (`Adiciona modo treino`), com escopo claro.
