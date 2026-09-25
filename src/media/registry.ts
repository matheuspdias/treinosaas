import type { ExerciseRef, ExerciseSource } from '@/domain/types'
import { catalogMediaProvider } from './catalogProvider'
import { createExerciseDbProvider } from './exerciseDbProvider'
import type { MediaProvider, ResolvedMedia } from './types'
import { NO_MEDIA } from './types'
import { userMediaProvider } from './userProvider'

const providers = new Map<ExerciseSource, MediaProvider>([
  ['catalog', catalogMediaProvider],
  ['custom', userMediaProvider],
])

const exerciseDb = createExerciseDbProvider({
  apiKey: import.meta.env.VITE_EXERCISEDB_API_KEY,
  baseUrl: import.meta.env.VITE_EXERCISEDB_BASE_URL,
})
if (exerciseDb) providers.set('exercisedb', exerciseDb)

export function resolveMedia(ref: ExerciseRef): Promise<ResolvedMedia> {
  return providers.get(ref.source)?.resolve(ref) ?? Promise.resolve(NO_MEDIA)
}

export function thumbnailUrl(ref: ExerciseRef): string | null {
  return providers.get(ref.source)?.thumbnailUrl?.(ref) ?? null
}
