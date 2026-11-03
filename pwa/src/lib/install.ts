/*
 * Convite de instalação do navegador (Chrome/Android) e escolha de seguir no navegador.
 * O evento chega cedo e uma vez só, por isso é capturado antes do React.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface InstallSnapshot {
  /** O navegador deixa abrir a janela de instalação por um botão. */
  canPrompt: boolean
  installed: boolean
  skipped: boolean
}

/** Na sessão do navegador: numa próxima visita a tela de instalação aparece de novo. */
const SKIP_KEY = 'treinoapp.install-skip'

function readSkip(): boolean {
  try {
    return sessionStorage.getItem(SKIP_KEY) === '1'
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
    // Quem escolheu o navegador fica com o aviso padrão do Chrome.
    if (snapshot.skipped) return
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
    sessionStorage.setItem(SKIP_KEY, '1')
  } catch {
    // modo privado: vale só até recarregar
  }
  set({ skipped: true })
}

/** Aberto pelo ícone da tela inicial (app instalado), e não numa aba do navegador. */
export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return (
    nav.standalone === true ||
    ['standalone', 'fullscreen', 'minimal-ui'].some(
      (mode) => window.matchMedia?.(`(display-mode: ${mode})`).matches,
    )
  )
}
