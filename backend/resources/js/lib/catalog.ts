/** Catálogo de exercícios do app (mesmo da PWA), carregado sob demanda pelo editor de treinos. */

export interface CatalogExercise {
  id: string
  name: string
  nameEn: string
  aliases: string[]
  groups: string[]
  equipment: string | null
  images: number
  popular: boolean
}

export interface Catalog {
  groups: { id: string; label: string }[]
  equipment: Record<string, string>
  exercises: CatalogExercise[]
  byId: Map<string, CatalogExercise>
  haystack: Map<string, string>
}

let promise: Promise<Catalog> | null = null

export function loadCatalog(url: string): Promise<Catalog> {
  promise ??= fetch(url, { credentials: 'same-origin' })
    .then((r) => {
      if (!r.ok) throw new Error('Não foi possível carregar os exercícios.')
      return r.json() as Promise<Omit<Catalog, 'byId' | 'haystack'>>
    })
    .then((data) => ({
      ...data,
      byId: new Map(data.exercises.map((e) => [e.id, e])),
      haystack: new Map(
        data.exercises.map((e) => [e.id, normalize([e.name, ...e.aliases, e.nameEn].join(' | '))]),
      ),
    }))
    .catch((err: unknown) => {
      promise = null
      throw err
    })
  return promise
}

/** Igual à PWA: sem acento, minúsculas. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function searchCatalog(
  catalog: Catalog,
  query: string,
  group: string | null,
): CatalogExercise[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  return catalog.exercises.filter(
    (e) =>
      (group === null || e.groups.includes(group)) &&
      terms.every((t) => catalog.haystack.get(e.id)!.includes(t)),
  )
}

export const exerciseImage = (id: string) => `/exercises/${encodeURIComponent(id)}/0.webp`
