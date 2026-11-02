import type { ExerciseRef, ExerciseSource } from '@/domain/types'

/** Mídia pronta para exibir, independente da origem. */
export type ExerciseMedia =
  | { kind: 'frames'; frames: string[] }
  | { kind: 'image'; src: string }
  | { kind: 'gif'; src: string }
  | { kind: 'video'; src: string }
  | { kind: 'youtube'; videoId: string }
  | { kind: 'none' }

export interface ResolvedMedia {
  media: ExerciseMedia
  /** Libera recursos (ex.: object URLs). Chamado quando a tela deixa de usar a mídia. */
  dispose?: () => void
}

/**
 * Um provedor sabe transformar uma referência de exercício da sua origem em mídia exibível.
 * Para plugar outra fonte (ex.: ExerciseDB), implemente esta interface e registre em registry.ts.
 */
export interface MediaProvider {
  source: ExerciseSource
  resolve(ref: ExerciseRef): Promise<ResolvedMedia>
  /** URL de miniatura estática para listas, quando houver. */
  thumbnailUrl?(ref: ExerciseRef): string | null
}

export const NO_MEDIA: ResolvedMedia = { media: { kind: 'none' } }
