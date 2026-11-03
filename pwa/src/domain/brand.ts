/*
 * Cor da academia aplicada ao app. A cor escolhida no painel é ajustada por tema para manter
 * o contraste dos tokens (accent sobre a superfície ≥ 4,5:1 e texto sobre o accent ≥ 4,5:1):
 * no tema claro escurece, no escuro clareia, como o verde padrão já faz.
 */

type Rgb = [number, number, number]

export interface AccentTokens {
  accent: string
  accentFg: string
  accentSoft: string
}

export interface BrandPalette {
  light: AccentTokens
  dark: AccentTokens
}

const LIGHT_SURFACE = '#ffffff'
const DARK_SURFACE = '#15181d'
const DARK_BG = '#0b0d10'
const MIN_CONTRAST = 4.5

export function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value)
}

function toRgb(hex: string): Rgb {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb
}

function toHex(rgb: Rgb): string {
  return `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`
}

/** Mistura `a` com `b` (t = 0 → a, t = 1 → b). */
function mix(a: string, b: string, t: number): string {
  const x = toRgb(a)
  const y = toRgb(b)
  return toHex([0, 1, 2].map((i) => x[i]! + (y[i]! - x[i]!) * t) as Rgb)
}

function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }) as Rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** Aproxima a cor de `toward` aos poucos até ter contraste suficiente com `surface`. */
function ensureContrast(color: string, surface: string, toward: string): string {
  for (let t = 0; t <= 1; t += 0.05) {
    const candidate = mix(color, toward, t)
    if (contrastRatio(candidate, surface) >= MIN_CONTRAST) return candidate
  }
  return toward
}

function readableFg(accent: string): string {
  return contrastRatio(accent, '#ffffff') >= contrastRatio(accent, DARK_BG) ? '#ffffff' : DARK_BG
}

export function brandPalette(color: string): BrandPalette {
  const hex = color.toLowerCase()
  const light = ensureContrast(hex, LIGHT_SURFACE, '#000000')
  const dark = ensureContrast(hex, DARK_SURFACE, '#ffffff')
  return {
    light: { accent: light, accentFg: readableFg(light), accentSoft: mix(light, '#ffffff', 0.85) },
    dark: { accent: dark, accentFg: readableFg(dark), accentSoft: mix(dark, DARK_BG, 0.78) },
  }
}
