import { ApiError, apiRequest } from './remote/client'
import { ACADEMY_SLUG } from './remote/config'
import { brandingSchema } from './remote/schemas'
import type { Branding } from './remote/schemas'

/*
 * Marca da academia (nome, cor, ícone). Fica em cache no localStorage para a primeira tela já
 * abrir com a cara da academia, inclusive offline, e é atualizada em segundo plano.
 */

export type BrandingState =
  | { status: 'loading' }
  | { status: 'ready'; branding: Branding }
  | { status: 'not_found' }
  /** Sem academia na URL (raiz do site). */
  | { status: 'none' }

const cacheKey = (slug: string) => `treinoapp.brand.${slug}`

function readCache(slug: string): Branding | null {
  try {
    const parsed = brandingSchema.safeParse(JSON.parse(localStorage.getItem(cacheKey(slug)) ?? ''))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function writeCache(branding: Branding): void {
  try {
    localStorage.setItem(cacheKey(branding.slug), JSON.stringify(branding))
  } catch {
    // modo privado: só não guarda
  }
}

function initial(): BrandingState {
  if (!ACADEMY_SLUG) return { status: 'none' }
  const cached = readCache(ACADEMY_SLUG)
  return cached ? { status: 'ready', branding: cached } : { status: 'loading' }
}

let state: BrandingState = initial()
const listeners = new Set<() => void>()

function set(next: BrandingState): void {
  state = next
  listeners.forEach((l) => l())
}

export function getBrandingState(): BrandingState {
  return state
}

export function subscribeBranding(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Busca a marca atual. Sem internet, segue com o cache (ou com a marca padrão). */
export async function refreshBranding(): Promise<void> {
  if (!ACADEMY_SLUG) return
  try {
    const branding = await apiRequest(`/academies/${ACADEMY_SLUG}`, { schema: brandingSchema })
    writeCache(branding)
    set({ status: 'ready', branding })
  } catch (error) {
    if (error instanceof ApiError && error.kind === 'not_found') {
      set({ status: 'not_found' })
      return
    }
    if (state.status === 'loading') {
      // Primeira abertura sem internet: usa só o slug, o resto vem depois.
      set({
        status: 'ready',
        branding: {
          slug: ACADEMY_SLUG,
          name: 'Academia',
          appName: 'Treino',
          brandColor: null,
          iconUrl: null,
        },
      })
    }
  }
}
