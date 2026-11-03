import { brandPalette, contrastRatio, isHexColor } from './brand'

describe('brandPalette', () => {
  it.each(['#2563eb', '#facc15', '#b8f24a', '#111827', '#ffffff', '#dc2626'])(
    'mantém o contraste nos dois temas (%s)',
    (color) => {
      const p = brandPalette(color)
      expect(contrastRatio(p.light.accent, '#ffffff')).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(p.dark.accent, '#15181d')).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(p.light.accentFg, p.light.accent)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(p.dark.accentFg, p.dark.accent)).toBeGreaterThanOrEqual(4.5)
    },
  )

  it('não mexe na cor que já tem contraste', () => {
    expect(brandPalette('#1D4ED8').light.accent).toBe('#1d4ed8')
    expect(brandPalette('#b8f24a').dark.accent).toBe('#b8f24a')
  })

  it('valida hexadecimal', () => {
    expect(isHexColor('#2563eb')).toBe(true)
    expect(isHexColor('azul')).toBe(false)
    expect(isHexColor('#fff')).toBe(false)
  })
})
