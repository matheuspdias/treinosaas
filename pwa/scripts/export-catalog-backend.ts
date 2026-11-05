/**
 * Exporta uma versão enxuta do catálogo (nomes pt-BR, apelidos, músculos e equipamento) para o
 * backend, onde o painel monta os treinos e o servidor valida os exercícios recebidos.
 * As imagens não são copiadas: o nginx serve pwa/public/exercises direto.
 * Exporta também os modelos de treino prontos (ABC, Full Body...), que toda academia nova recebe
 * como modelos dela.
 *
 * Uso: npm run catalog:backend (rodar de novo sempre que o catálogo ou os nomes mudarem)
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { EXERCISE_NAMES_PT_BR } from '../src/catalog/i18n/pt-BR'
import { MUSCLE_GROUPS } from '../src/domain/muscles'
import { TEMPLATES } from '../src/templates/templates'
import type { RawCatalogExercise } from '../src/catalog/types'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, '..', 'backend', 'resources', 'catalog', 'exercises.json')
const OUT_TEMPLATES = join(ROOT, '..', 'backend', 'resources', 'catalog', 'templates.json')

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barra',
  dumbbell: 'Halteres',
  machine: 'Máquina',
  cable: 'Polia',
  'body only': 'Peso corporal',
  kettlebells: 'Kettlebell',
  bands: 'Elástico',
  'e-z curl bar': 'Barra W',
  'medicine ball': 'Medicine ball',
  'exercise ball': 'Bola suíça',
  'foam roll': 'Rolo',
  other: 'Outro',
}

const raw = JSON.parse(
  await readFile(join(ROOT, 'src', 'catalog', 'generated', 'exercises.json'), 'utf8'),
) as RawCatalogExercise[]

interface Group {
  id: string
  label: string
  muscles: readonly string[]
}
const groups: readonly Group[] = MUSCLE_GROUPS

const groupOf = new Map<string, string>(
  groups.flatMap((g) => g.muscles.map((m) => [m, g.id] as const)),
)

const exercises = raw
  .map((ex) => {
    const pt = EXERCISE_NAMES_PT_BR[ex.id]
    return {
      id: ex.id,
      name: pt?.name ?? ex.name,
      nameEn: ex.name,
      aliases: pt?.aliases ?? [],
      groups: [...new Set(ex.primaryMuscles.map((m) => groupOf.get(m)).filter(Boolean))],
      equipment: ex.equipment,
      images: ex.imageCount,
      popular: pt !== undefined,
    }
  })
  .sort((a, b) => Number(b.popular) - Number(a.popular) || a.name.localeCompare(b.name, 'pt-BR'))

const out = {
  groups: groups.map((g) => ({ id: g.id, label: g.label })),
  equipment: EQUIPMENT_LABELS,
  exercises,
}

await mkdir(dirname(OUT), { recursive: true })
await writeFile(OUT, JSON.stringify(out))
console.log(`${exercises.length} exercícios exportados para ${OUT}`)

// O painel só monta treinos com exercícios do catálogo: modelos com personalizados ficam de fora.
const templates = TEMPLATES.filter((t) => !t.customExercises?.length).map((t) => ({
  id: t.id,
  name: t.name,
  plans: t.plans.map((plan) => ({
    name: plan.name,
    color: plan.color,
    exercises: plan.exercises.map(([exerciseId, sets, repMin, repMax, restSec, opts]) => ({
      exerciseId,
      sets,
      repMin,
      repMax,
      restSec,
      incrementKg: opts?.incrementKg ?? null,
      notes: opts?.notes ?? null,
    })),
  })),
}))

await writeFile(OUT_TEMPLATES, JSON.stringify(templates, null, 2) + '\n')
console.log(`${templates.length} modelos prontos exportados para ${OUT_TEMPLATES}`)
