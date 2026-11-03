import { brandPalette, isHexColor } from '@/domain/brand'
import type { AccentTokens } from '@/domain/brand'

const STYLE_ID = 'brand-colors'

const block = (theme: 'light' | 'dark', t: AccentTokens) =>
  `[data-theme='${theme}']{--c-accent:${t.accent};--c-accent-fg:${t.accentFg};--c-accent-soft:${t.accentSoft};}`

/** Troca os tokens de destaque pela cor da academia (ajustada para contraste em cada tema). */
export function applyBrandColors(color: string | null): void {
  let style = document.getElementById(STYLE_ID)
  if (!color || !isHexColor(color)) {
    style?.remove()
    return
  }
  const palette = brandPalette(color)
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.append(style)
  }
  style.textContent = block('light', palette.light) + block('dark', palette.dark)
}
