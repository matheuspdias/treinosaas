import { formatRelativeDay, greeting } from './dates'

describe('formatRelativeDay', () => {
  const now = new Date(2026, 5, 15, 9, 0)
  const daysAgo = (n: number, hour = 20) => new Date(2026, 5, 15 - n, hour).toISOString()
  it.each([
    [0, 'hoje'],
    [1, 'ontem'],
    [3, 'há 3 dias'],
    [13, 'há 13 dias'],
    [21, 'há 3 semanas'],
    [90, 'há 3 meses'],
    [400, 'há 1 ano'],
    [800, 'há 2 anos'],
  ])('%i dias atrás → %s', (n, text) => expect(formatRelativeDay(daysAgo(n), now)).toBe(text))
})

describe('greeting', () => {
  it.each([
    [3, 'Boa noite'],
    [8, 'Bom dia'],
    [14, 'Boa tarde'],
    [21, 'Boa noite'],
  ])('%ih → %s', (h, text) => expect(greeting(new Date(2026, 0, 1, h))).toBe(text))
})
