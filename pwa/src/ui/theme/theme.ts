import type { ThemePreference } from '@/domain/types'

const STORAGE_KEY = 'treinoapp.theme'
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

function resolve(pref: ThemePreference): 'light' | 'dark' {
  if (pref !== 'system') return pref
  return media().matches ? 'dark' : 'light'
}

function paint(pref: ThemePreference): void {
  const theme = resolve(pref)
  document.documentElement.dataset.theme = theme
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--c-bg').trim()
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', bg || (theme === 'dark' ? '#0b0d10' : '#f4f5f7'))
}

let current: ThemePreference = 'system'
let listening = false

/**
 * Aplica o tema. A preferência fica espelhada no localStorage só para pintar
 * a primeira tela sem piscar (script inline no index.html); a fonte da verdade é o IndexedDB.
 */
export function applyTheme(pref: ThemePreference): void {
  current = pref
  paint(pref)
  try {
    localStorage.setItem(STORAGE_KEY, pref)
  } catch {
    // modo privado: ignora
  }
  if (!listening) {
    listening = true
    media().addEventListener('change', () => {
      if (current === 'system') paint('system')
    })
  }
}
