import { normalizeText } from '@/domain/text'
import type { Equipment, Exercise, Muscle } from '@/domain/types'

export interface SearchableExercise extends Exercise {
  popular: boolean
  haystack: string
  normalizedName: string
}

export interface ExerciseFilters {
  query: string
  muscle: Muscle | null
  equipment: Equipment | null
}

export const EMPTY_FILTERS: ExerciseFilters = { query: '', muscle: null, equipment: null }

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' })

function score(ex: SearchableExercise, q: string, tokens: string[]): number {
  let s = 0
  if (ex.normalizedName === q) s += 100
  else if (ex.normalizedName.startsWith(q)) s += 50
  else if (ex.normalizedName.includes(q)) s += 25
  if (tokens.every((t) => ex.normalizedName.includes(t))) s += 20
  if (ex.popular) s += 10
  return s
}

/**
 * Filtra e ordena exercícios.
 * - Busca ignora acentos e caixa, em pt-BR, sinônimos e inglês; todas as palavras precisam aparecer.
 * - Sem busca: populares primeiro, depois ordem alfabética.
 */
export function searchExercises<T extends SearchableExercise>(
  list: readonly T[],
  filters: ExerciseFilters,
): T[] {
  const q = normalizeText(filters.query)
  const tokens = q ? q.split(' ') : []

  const filtered = list.filter((ex) => {
    if (filters.muscle && !ex.primaryMuscles.includes(filters.muscle)) return false
    if (filters.equipment && ex.equipment !== filters.equipment) return false
    return tokens.every((t) => ex.haystack.includes(t))
  })

  if (!q) {
    return filtered.sort(
      (a, b) => Number(b.popular) - Number(a.popular) || collator.compare(a.name, b.name),
    )
  }
  return filtered
    .map((ex) => ({ ex, s: score(ex, q, tokens) }))
    .sort((a, b) => b.s - a.s || collator.compare(a.ex.name, b.ex.name))
    .map((x) => x.ex)
}
