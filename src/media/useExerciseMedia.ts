import { useEffect, useState } from 'react'
import type { ExerciseRef } from '@/domain/types'
import { resolveMedia } from './registry'
import type { ExerciseMedia } from './types'

/** Mídia de um exercício; `undefined` enquanto carrega. Libera object URLs ao desmontar. */
export function useExerciseMedia(ref: ExerciseRef | undefined): ExerciseMedia | undefined {
  const [state, setState] = useState<{ key: string; media: ExerciseMedia } | undefined>()
  const key = ref ? `${ref.source}:${ref.id}` : ''

  useEffect(() => {
    if (!ref) return
    let cancelled = false
    let dispose: (() => void) | undefined
    void resolveMedia(ref).then((resolved) => {
      if (cancelled) {
        resolved.dispose?.()
        return
      }
      dispose = resolved.dispose
      setState({ key, media: resolved.media })
    })
    return () => {
      cancelled = true
      dispose?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ref é identificado por `key`
  }, [key])

  return state?.key === key ? state.media : undefined
}
