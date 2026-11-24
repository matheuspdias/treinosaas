/*
 * Instalação do painel como app (PWA), igual ao app do aluno: convite do navegador
 * (Chrome/Edge), detecção da plataforma e a escolha de seguir no navegador.
 * O evento do navegador chega cedo e uma vez só, por isso é capturado antes do React.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallPlatform = 'ios' | 'android' | 'in_app' | 'desktop'

export interface InstallSnapshot {
  /** O navegador deixa abrir a janela de instalação por um botão. */
  canPrompt: boolean
  installed: boolean
  skipped: boolean
}

/** Quem escolhe o navegador não vê a tela de novo por uma semana (a equipe entra todo dia). */
const SKIP_KEY = 'treinosaas.install-skip-until'
const SKIP_DAYS = 7

/** Navegadores embutidos em outros apps (Instagram, Facebook, TikTok...): neles não dá para instalar. */
const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|TikTok|musical_ly|Snapchat|; wv\)/i

export function installPlatform(userAgent: string, maxTouchPoints = 0): InstallPlatform {
  if (IN_APP.test(userAgent)) return 'in_app'
  // iPad com iPadOS se apresenta como Mac; o toque denuncia.
  if (/iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)) {
    return 'ios'
  }
  if (/Android/.test(userAgent)) return 'android'
  return 'desktop'
}

function readSkip(): boolean {
  try {
    return Number(localStorage.getItem(SKIP_KEY) ?? 0) > Date.now()
  } catch {
    return false
  }
}

let deferred: BeforeInstallPromptEvent | null = null
let snapshot: InstallSnapshot = { canPrompt: false, installed: false, skipped: readSkip() }
const listeners = new Set<() => void>()

function set(patch: Partial<InstallSnapshot>): void {
  snapshot = { ...snapshot, ...patch }
  listeners.forEach((l) => l())
}

export function getInstallSnapshot(): InstallSnapshot {
  return snapshot
}

export function subscribeInstall(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function listenForInstall(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferred = event as BeforeInstallPromptEvent
    set({ canPrompt: true })
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    set({ canPrompt: false, installed: true })
  })
}

/** Abre a janela de instalação do sistema. Só vale uma vez por evento do navegador. */
export async function promptInstall(): Promise<void> {
  const event = deferred
  if (!event) return
  deferred = null
  await event.prompt()
  const { outcome } = await event.userChoice
  set({ canPrompt: false, installed: snapshot.installed || outcome === 'accepted' })
}

export function skipInstall(): void {
  try {
    localStorage.setItem(SKIP_KEY, String(Date.now() + SKIP_DAYS * 86_400_000))
  } catch {
    // modo privado: vale só até recarregar
  }
  set({ skipped: true })
}

/** Aberto pelo ícone (app instalado), e não numa aba do navegador. */
export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return (
    nav.standalone === true ||
    ['standalone', 'fullscreen', 'minimal-ui'].some(
      (mode) => window.matchMedia?.(`(display-mode: ${mode})`).matches,
    )
  )
}

/** Service worker do painel (public/painel-sw.js): sem ele o Chrome não oferece a instalação. */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/painel-sw.js').catch(() => {
      // sem service worker o painel funciona igual, só não instala
    })
  })
}
