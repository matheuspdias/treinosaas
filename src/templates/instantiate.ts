import { normalizeText } from '@/domain/text'
import type { CustomExercise, ExerciseRef, ID, Plan, Settings } from '@/domain/types'
import type { WorkoutTemplate } from './templates'

export interface InstantiatedTemplate {
  plans: Plan[]
  /** Exercícios personalizados novos (os que o usuário ainda não tinha). */
  customExercises: CustomExercise[]
}

/**
 * Cria fichas novas (ids novos, carga 0) a partir de um modelo, no fim da sequência.
 * Exercícios fora do catálogo viram exercícios personalizados; se o usuário já tem um
 * com o mesmo nome, ele é reaproveitado. Não altera o modelo nem dados existentes.
 */
export function instantiateTemplate(
  template: WorkoutTemplate,
  opts: {
    startOrder: number
    defaults: Pick<Settings, 'defaultIncrementKg'>
    existingCustom?: readonly CustomExercise[]
  },
  newId: () => ID = () => crypto.randomUUID(),
  now: string = new Date().toISOString(),
): InstantiatedTemplate {
  const existingByName = new Map(
    (opts.existingCustom ?? [])
      .filter((c) => !c.deletedAt)
      .map((c) => [normalizeText(c.name), c.id] as const),
  )
  const customExercises: CustomExercise[] = []
  const customIds = new Map<string, ID>()
  for (const c of template.customExercises ?? []) {
    const existing = existingByName.get(normalizeText(c.name))
    if (existing) {
      customIds.set(c.key, existing)
      continue
    }
    const created: CustomExercise = {
      id: newId(),
      createdAt: now,
      updatedAt: now,
      name: c.name,
      primaryMuscles: [...c.primaryMuscles],
      secondaryMuscles: [...c.secondaryMuscles],
      equipment: c.equipment,
      instructions: c.instructions,
    }
    customExercises.push(created)
    customIds.set(c.key, created.id)
  }

  const toRef = (id: string): ExerciseRef => {
    const customId = customIds.get(id)
    return customId ? { source: 'custom', id: customId } : { source: 'catalog', id }
  }

  const plans: Plan[] = template.plans.map((tp, i) => ({
    id: newId(),
    createdAt: now,
    updatedAt: now,
    name: tp.name,
    color: tp.color,
    order: opts.startOrder + i,
    exercises: tp.exercises.map(([exerciseId, sets, repMin, repMax, restSec, extra]) => ({
      id: newId(),
      exercise: toRef(exerciseId),
      sets,
      repMin,
      repMax,
      restSec,
      loadKg: 0,
      incrementKg: extra?.incrementKg ?? opts.defaults.defaultIncrementKg,
      notes: extra?.notes ?? '',
    })),
  }))

  return { plans, customExercises }
}
