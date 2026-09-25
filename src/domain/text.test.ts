import { normalizeText, sequenceLetter } from './text'

describe('text', () => {
  it('remove acentos, caixa e pontuação', () => {
    expect(normalizeText('  Tríceps  Francês ')).toBe('triceps frances')
    expect(normalizeText('Push-Up_Wide')).toBe('push up wide')
    expect(normalizeText('Elevação (lateral)')).toBe('elevacao lateral')
  })
  it('gera letras de sequência', () => {
    expect([0, 1, 25, 26, 27].map(sequenceLetter)).toEqual(['A', 'B', 'Z', 'AA', 'AB'])
  })
})
