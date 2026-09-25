import type { MediaProvider } from './types'
import { NO_MEDIA } from './types'

/**
 * Provedor da API ExerciseDB (https://exercisedb.dev / RapidAPI).
 * Fica inativo até definir VITE_EXERCISEDB_API_KEY (e opcionalmente VITE_EXERCISEDB_BASE_URL).
 * Não é usado na Fase 1: existe para a integração futura entrar sem refatorar as telas.
 */
export function createExerciseDbProvider(env: {
  apiKey?: string
  baseUrl?: string
}): MediaProvider | null {
  if (!env.apiKey) return null
  const baseUrl = env.baseUrl ?? 'https://exercisedb.p.rapidapi.com'
  const host = new URL(baseUrl).host
  return {
    source: 'exercisedb',
    async resolve(ref) {
      try {
        const res = await fetch(`${baseUrl}/exercises/exercise/${encodeURIComponent(ref.id)}`, {
          headers: { 'X-RapidAPI-Key': env.apiKey!, 'X-RapidAPI-Host': host },
        })
        if (!res.ok) return NO_MEDIA
        const data = (await res.json()) as { gifUrl?: string }
        return data.gifUrl ? { media: { kind: 'gif', src: data.gifUrl } } : NO_MEDIA
      } catch {
        return NO_MEDIA
      }
    },
  }
}
