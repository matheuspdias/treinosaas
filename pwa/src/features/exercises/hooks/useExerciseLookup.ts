import { useMemo } from 'react'
import { useCatalog } from '@/catalog/useCatalog'
import { normalizeText } from '@/domain/text'
import type { CustomExercise, Exercise, ExerciseRef } from '@/domain/types'
import { useCustomExercises } from '@/data/hooks'

export interface LibraryExercise extends Exercise {
  popular: boolean
  haystack: string
  normalizedName: string
}

export function customToExercise(c: CustomExercise): LibraryExercise {
  return {
    ref: { source: 'custom', id: c.id },
    name: c.name,
    primaryMuscles: c.primaryMuscles,
    secondaryMuscles: c.secondaryMuscles,
    equipment: c.equipment,
    instructions: c.instructions ? c.instructions.split('\n').filter(Boolean) : [],
    // Personalizados sempre aparecem junto dos populares.
    popular: true,
    haystack: normalizeText(c.name),
    normalizedName: normalizeText(c.name),
  }
}

export interface ExerciseLookup {
  ready: boolean
  /** Catálogo + personalizados. */
  all: LibraryExercise[]
  get: (ref: ExerciseRef) => LibraryExercise | undefined
  name: (ref: ExerciseRef) => string
}

export function useExerciseLookup(): ExerciseLookup {
  const catalog = useCatalog()
  const custom = useCustomExercises()

  return useMemo(() => {
    const customList = (custom ?? []).map(customToExercise)
    const all: LibraryExercise[] = [...customList, ...(catalog ?? [])]
    const byKey = new Map(all.map((e) => [`${e.ref.source}:${e.ref.id}`, e]))
    const get = (ref: ExerciseRef) => byKey.get(`${ref.source}:${ref.id}`)
    return {
      ready: catalog !== undefined && custom !== undefined,
      all,
      get,
      name: (ref) =>
        get(ref)?.name ??
        (ref.source === 'custom' ? 'Exercício removido' : ref.id.replace(/_/g, ' ')),
    }
  }, [catalog, custom])
}
