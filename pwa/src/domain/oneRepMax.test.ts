import { epley1RM } from './oneRepMax'

describe('epley1RM', () => {
  it('aplica carga × (1 + reps/30)', () => {
    expect(epley1RM(100, 10)).toBeCloseTo(133.333, 3)
    expect(epley1RM(60, 5)).toBeCloseTo(70, 9)
  })
  it('com 1 repetição retorna a própria carga', () => {
    expect(epley1RM(120, 1)).toBe(120)
  })
  it('retorna 0 sem carga ou sem reps', () => {
    expect(epley1RM(0, 10)).toBe(0)
    expect(epley1RM(100, 0)).toBe(0)
  })
})
