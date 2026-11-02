import { repos } from '@/data'
import type { MediaProvider } from './types'
import { NO_MEDIA } from './types'

/** Mídia de exercícios personalizados: blob no IndexedDB ou vídeo do YouTube. */
export const userMediaProvider: MediaProvider = {
  source: 'custom',
  async resolve(ref) {
    const exercise = await repos.customExercises.get(ref.id)
    const media = exercise?.media
    if (!media) return NO_MEDIA
    if (media.kind === 'youtube') return { media: { kind: 'youtube', videoId: media.videoId } }
    const stored = await repos.media.get(media.blobId)
    if (!stored) return NO_MEDIA
    const src = URL.createObjectURL(stored.blob)
    return {
      media: media.mediaType === 'video' ? { kind: 'video', src } : { kind: media.mediaType, src },
      dispose: () => URL.revokeObjectURL(src),
    }
  },
}
