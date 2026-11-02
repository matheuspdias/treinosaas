import {
  formatVolume,
  formatWeight,
  fromDisplayUnit,
  parseDecimal,
  parseWeightInput,
  toDisplayUnit,
} from './units'

describe('units', () => {
  it('aceita vírgula e ponto como separador decimal', () => {
    expect(parseDecimal('2,5')).toBe(2.5)
    expect(parseDecimal('2.5')).toBe(2.5)
    expect(parseDecimal(' 10 ')).toBe(10)
    expect(parseDecimal(',5')).toBe(0.5)
  })

  it('rejeita entradas inválidas', () => {
    for (const bad of ['', 'abc', '-3', '1,2,3', '.', '1e3']) expect(parseDecimal(bad)).toBeNull()
  })

  it('formata carga em pt-BR', () => {
    expect(formatWeight(62.5, 'kg')).toBe('62,5 kg')
    expect(formatWeight(100, 'kg')).toBe('100 kg')
    expect(formatWeight(100, 'kg', false)).toBe('100')
  })

  it('formata volume com separador de milhar', () => {
    expect(formatVolume(12450, 'kg')).toBe('12.450 kg')
  })

  it('converte lb ↔ kg sem perder precisão', () => {
    expect(toDisplayUnit(fromDisplayUnit(225, 'lb'), 'lb')).toBeCloseTo(225, 9)
    expect(formatWeight(fromDisplayUnit(45, 'lb'), 'lb')).toBe('45 lb')
    expect(parseWeightInput('100', 'lb')).toBeCloseTo(45.359, 3)
    expect(parseWeightInput('2,5', 'kg')).toBe(2.5)
  })
})
