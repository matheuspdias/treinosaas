/**
 * Cache offline das imagens do catálogo. Usa o mesmo cache que a regra CacheFirst
 * do service worker (vite.config.ts), então o que for baixado aqui já serve offline.
 */
export const EXERCISE_IMAGE_CACHE = 'exercise-images'

function cacheSupported(): boolean {
  return typeof caches !== 'undefined'
}

export async function cachedImageCount(): Promise<number> {
  if (!cacheSupported()) return 0
  const cache = await caches.open(EXERCISE_IMAGE_CACHE)
  return (await cache.keys()).length
}

/** Baixa as URLs que ainda não estão no cache. Retorna quantas falharam. */
export async function precacheUrls(
  urls: readonly string[],
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<number> {
  if (!cacheSupported()) return 0
  const cache = await caches.open(EXERCISE_IMAGE_CACHE)
  const absolute = urls.map((u) => new URL(u, location.origin).href)
  const pending: string[] = []
  for (const url of absolute) {
    if (!(await cache.match(url))) pending.push(url)
  }
  let done = urls.length - pending.length
  let failed = 0
  onProgress?.(done, urls.length)
  const worker = async () => {
    while (pending.length && !signal?.aborted) {
      const url = pending.shift()!
      try {
        const res = await fetch(url, { signal })
        if (res.ok) await cache.put(url, res)
        else failed++
      } catch {
        failed++
      }
      onProgress?.(++done, urls.length)
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker))
  return failed
}

/** Pede ao navegador para não apagar os dados do app quando faltar espaço. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    return false
  }
}
