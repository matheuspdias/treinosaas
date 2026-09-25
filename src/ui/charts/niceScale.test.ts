import { niceScale } from './niceScale'

describe('niceScale', () => {
  it('gera marcas limpas que cobrem os dados', () => {
    expect(niceScale(66.7, 80.5)).toEqual({ domain: [65, 85], ticks: [65, 70, 75, 80, 85] })
    expect(niceScale(420, 1800).ticks).toEqual([0, 500, 1000, 1500, 2000])
  })
  it('não desce abaixo de zero', () => {
    expect(niceScale(0.5, 3).domain[0]).toBe(0)
  })
  it('valor único ganha folga', () => {
    const { domain } = niceScale(80, 80)
    expect(domain[0]).toBeLessThan(80)
    expect(domain[1]).toBeGreaterThan(80)
  })
  it('passos decimais sem lixo de ponto flutuante', () => {
    expect(niceScale(81.2, 82.1).ticks.every((t) => Number.isInteger(t * 10))).toBe(true)
  })
})
