import { useEffect } from 'react'
import { usePlans } from '@/data/hooks'
import { isActivePlan } from '@/domain/sequence'
import { precacheUrls } from '@/lib/imageCache'
import { catalogImageUrl } from '@/media/catalogProvider'

/**
 * Garante offline as imagens dos exercícios que estão nas fichas ativas.
 * Roda em segundo plano sempre que as fichas mudam; o que já está em cache é pulado.
 */
export function usePlanImagePrefetch(): void {
  const plans = usePlans()
  const ids = [
    ...new Set(
      (plans ?? [])
        .filter(isActivePlan)
        .flatMap((p) =>
          p.exercises.filter((e) => e.exercise.source === 'catalog').map((e) => e.exercise.id),
        ),
    ),
  ]
    .sort()
    .join('|')

  useEffect(() => {
    if (!ids || !navigator.onLine) return
    const controller = new AbortController()
    const urls = ids.split('|').flatMap((id) => [catalogImageUrl(id, 0), catalogImageUrl(id, 1)])
    const start = () => void precacheUrls(urls, undefined, controller.signal)
    const handle =
      'requestIdleCallback' in window
        ? requestIdleCallback(start, { timeout: 3000 })
        : setTimeout(start, 1500)
    return () => {
      controller.abort()
      if ('cancelIdleCallback' in window) cancelIdleCallback(handle as number)
      else clearTimeout(handle as ReturnType<typeof setTimeout>)
    }
  }, [ids])
}
