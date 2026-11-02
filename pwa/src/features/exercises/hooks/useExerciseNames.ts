import { useMemo } from 'react'
import { EXERCISE_NAMES_PT_BR } from '@/catalog/i18n/pt-BR'
import { useCustomExercises } from '@/data/hooks'
import type { ExerciseRef } from '@/domain/types'

/**
 * Nomes de exercício sem carregar o catálogo completo (~150 kB gzip): usa o mapa pt-BR,
 * os personalizados e, por último, o id do dataset (que é o nome em inglês).
 * Para telas leves como a inicial; telas com mídia e filtros usam useExerciseLookup.
 */
export function useExerciseNames(): (ref: ExerciseRef) => string {
  const custom = useCustomExercises()
  return useMemo(() => {
    const customNames = new Map((custom ?? []).map((c) => [c.id, c.name]))
    return (ref) =>
      ref.source === 'custom'
        ? (customNames.get(ref.id) ?? 'Exercício removido')
        : (EXERCISE_NAMES_PT_BR[ref.id]?.name ?? ref.id.replace(/_/g, ' '))
  }, [custom])
}
