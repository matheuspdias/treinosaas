import { EQUIPMENT_PT_BR, MUSCLE_PT_BR } from '@/catalog/i18n/pt-BR'
import type { Exercise, ExerciseRef } from '@/domain/types'

export const refKey = (ref: ExerciseRef): string => `${ref.source}:${ref.id}`

/** "Peito, Tríceps · Halteres" */
export function exerciseSubtitle(ex: Pick<Exercise, 'primaryMuscles' | 'equipment'>): string {
  return [
    ex.primaryMuscles.map((m) => MUSCLE_PT_BR[m]).join(', '),
    ex.equipment && EQUIPMENT_PT_BR[ex.equipment],
  ]
    .filter(Boolean)
    .join(' · ')
}
