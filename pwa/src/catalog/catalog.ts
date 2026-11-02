import { EQUIPMENT, MUSCLES } from '@/domain/types'
import type { Equipment, Muscle } from '@/domain/types'
import { normalizeText } from '@/domain/text'
import { EXERCISE_NAMES_PT_BR } from './i18n/pt-BR'
import type { CatalogExercise, RawCatalogExercise } from './types'

const muscleSet = new Set<string>(MUSCLES)
const equipmentSet = new Set<string>(EQUIPMENT)

export function buildCatalog(raw: readonly RawCatalogExercise[]): CatalogExercise[] {
  return raw.map((ex) => {
    const pt = EXERCISE_NAMES_PT_BR[ex.id]
    const name = pt?.name ?? ex.name
    const haystack = normalizeText([name, ...(pt?.aliases ?? []), ex.name].join(' | '))
    return {
      ref: { source: 'catalog', id: ex.id },
      name,
      nameEn: ex.name,
      primaryMuscles: ex.primaryMuscles.filter((m): m is Muscle => muscleSet.has(m)),
      secondaryMuscles: ex.secondaryMuscles.filter((m): m is Muscle => muscleSet.has(m)),
      equipment:
        ex.equipment && equipmentSet.has(ex.equipment) ? (ex.equipment as Equipment) : null,
      category: ex.category,
      instructions: ex.instructions,
      popular: pt !== undefined,
      imageCount: ex.imageCount,
      haystack,
      normalizedName: normalizeText(name),
    }
  })
}

let catalogPromise: Promise<CatalogExercise[]> | null = null
let catalogById: Map<string, CatalogExercise> | null = null

/** Carrega o catálogo (chunk separado, precacheado pelo service worker). */
export function loadCatalog(): Promise<CatalogExercise[]> {
  catalogPromise ??= import('./generated/exercises.json').then((m) => {
    const list = buildCatalog(m.default as RawCatalogExercise[])
    catalogById = new Map(list.map((e) => [e.ref.id, e]))
    return list
  })
  return catalogPromise
}

/** Acesso síncrono depois que o catálogo carregou. */
export function getCatalogExercise(id: string): CatalogExercise | undefined {
  return catalogById?.get(id)
}

export function isCatalogLoaded(): boolean {
  return catalogById !== null
}
