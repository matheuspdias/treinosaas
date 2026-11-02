import { getCatalogExercise, loadCatalog } from '@/catalog/catalog'
import type { MediaProvider } from './types'
import { NO_MEDIA } from './types'

export function catalogImageUrl(id: string, frame: 0 | 1): string {
  return `/exercises/${encodeURIComponent(id)}/${frame}.webp`
}

export const catalogMediaProvider: MediaProvider = {
  source: 'catalog',
  async resolve(ref) {
    await loadCatalog()
    const ex = getCatalogExercise(ref.id)
    if (!ex || ex.imageCount === 0) return NO_MEDIA
    const frames =
      ex.imageCount >= 2
        ? [catalogImageUrl(ref.id, 0), catalogImageUrl(ref.id, 1)]
        : [catalogImageUrl(ref.id, 0)]
    return { media: { kind: 'frames', frames } }
  },
  thumbnailUrl(ref) {
    const ex = getCatalogExercise(ref.id)
    return ex && ex.imageCount === 0 ? null : catalogImageUrl(ref.id, 0)
  },
}
