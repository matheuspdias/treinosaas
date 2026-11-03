import type { BrandingState } from '@/data/branding'
import { API_URL, ACADEMY_SLUG } from '@/data/remote/config'
import { applyBrandColors } from '@/ui/theme/brandColors'

function headLink(rel: string): HTMLLinkElement {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!link) {
    link = document.createElement('link')
    link.rel = rel
    document.head.append(link)
  }
  return link
}

function headMeta(name: string, content: string): void {
  document.head.querySelector(`meta[name="${name}"]`)?.setAttribute('content', content)
}

/**
 * Manifest do app da academia (gerado pela API com nome, cor e ícone dela). Entra antes do
 * React para o navegador já oferecer a instalação com a marca certa.
 */
export function linkAcademyManifest(): void {
  if (!ACADEMY_SLUG || !API_URL) return
  headLink('manifest').href = `${API_URL}/academies/${ACADEMY_SLUG}/manifest.webmanifest`
}

/** Título, ícones (inclusive o do iPhone, que não lê o manifest) e cor da academia. */
export function applyBranding(state: BrandingState): void {
  if (state.status !== 'ready') return
  const { appName, brandColor, iconUrl } = state.branding
  document.title = appName
  headMeta('apple-mobile-web-app-title', appName)
  if (iconUrl) {
    headLink('apple-touch-icon').href = iconUrl
    document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"]').forEach((l) => {
      l.href = iconUrl
      l.removeAttribute('type')
      l.removeAttribute('sizes')
    })
  }
  applyBrandColors(brandColor)
}
