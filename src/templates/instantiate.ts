import type { ID, Plan, Settings } from '@/domain/types'
import type { WorkoutTemplate } from './templates'

/**
 * Cria fichas novas (ids novos, carga 0) a partir de um modelo, no fim da sequência.
 * Não altera o modelo nem fichas existentes.
 */
export function instantiateTemplate(
  template: WorkoutTemplate,
  opts: { startOrder: number; defaults: Pick<Settings, 'defaultIncrementKg'> },
  newId: () => ID = () => crypto.randomUUID(),
  now: string = new Date().toISOString(),
): Plan[] {
  return template.plans.map((tp, i) => ({
    id: newId(),
    createdAt: now,
    updatedAt: now,
    name: tp.name,
    color: tp.color,
    order: opts.startOrder + i,
    exercises: tp.exercises.map(([exerciseId, sets, repMin, repMax, restSec]) => ({
      id: newId(),
      exercise: { source: 'catalog', id: exerciseId },
      sets,
      repMin,
      repMax,
      restSec,
      loadKg: 0,
      incrementKg: opts.defaults.defaultIncrementKg,
      notes: '',
    })),
  }))
}
