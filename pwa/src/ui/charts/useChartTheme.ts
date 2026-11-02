import { useSyncExternalStore } from 'react'

export interface ChartTheme {
  series: string
  muted: string
  grid: string
  text: string
  textMuted: string
  surface: string
}

function read(): ChartTheme {
  const css = getComputedStyle(document.documentElement)
  const v = (name: string) => css.getPropertyValue(name).trim()
  return {
    series: v('--c-chart'),
    muted: v('--c-chart-muted'),
    grid: v('--c-chart-grid'),
    text: v('--c-fg'),
    textMuted: v('--c-fg-subtle'),
    surface: v('--c-surface'),
  }
}

let cache: { theme: string | undefined; value: ChartTheme } | null = null

function snapshot(): ChartTheme {
  const theme = document.documentElement.dataset.theme
  if (!cache || cache.theme !== theme) cache = { theme, value: read() }
  return cache.value
}

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => mo.disconnect()
}

/**
 * Cores dos gráficos a partir dos tokens CSS (atributos SVG não aceitam var()).
 * Atualiza quando o tema muda.
 */
export function useChartTheme(): ChartTheme {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
