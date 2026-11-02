import type { Exercise } from '@/domain/types'

/** Formato de src/catalog/generated/exercises.json (gerado por scripts/build-catalog.ts). */
export interface RawCatalogExercise {
  id: string
  name: string
  category: string
  level: string
  mechanic: string | null
  force: string | null
  equipment: string | null
  primaryMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
  imageCount: number
}

export interface CatalogExercise extends Exercise {
  /** Tem nome em pt-BR: exercício comum de academia, aparece primeiro. */
  popular: boolean
  imageCount: number
  /** Texto normalizado para busca: nome pt-BR, sinônimos e nome em inglês. */
  haystack: string
  /** Nome pt-BR normalizado (para priorizar correspondências no início). */
  normalizedName: string
}
