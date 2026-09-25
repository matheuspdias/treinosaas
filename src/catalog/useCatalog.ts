import { useEffect, useState } from 'react'
import { loadCatalog } from './catalog'
import type { CatalogExercise } from './types'

let loaded: CatalogExercise[] | undefined

/** Catálogo completo; `undefined` só no primeiro carregamento (o chunk vem do cache). */
export function useCatalog(): CatalogExercise[] | undefined {
  const [catalog, setCatalog] = useState(loaded)
  useEffect(() => {
    if (loaded) return
    let alive = true
    void loadCatalog().then((list) => {
      loaded = list
      if (alive) setCatalog(list)
    })
    return () => {
      alive = false
    }
  }, [])
  return catalog
}
