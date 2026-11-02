export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'treinosaas.theme'
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

export function getThemePreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

function paint(pref: ThemePreference): void {
  const dark = pref === 'dark' || (pref === 'system' && media().matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

export function setThemePreference(pref: ThemePreference): void {
  try {
    if (pref === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, pref)
  } catch {
    // Sem storage (aba privada): vale só até recarregar.
  }
  paint(pref)
}

/** Aplica o tema salvo e acompanha o sistema quando a preferência é "system". */
export function initTheme(): void {
  paint(getThemePreference())
  media().addEventListener('change', () => {
    if (getThemePreference() === 'system') paint('system')
  })
}
