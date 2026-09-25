import { formatClock, formatDurationLong, restRemainingSec } from './duration'

describe('duration', () => {
  it('formata relógio', () => {
    expect(formatClock(75)).toBe('1:15')
    expect(formatClock(3725)).toBe('1:02:05')
    expect(formatClock(-4)).toBe('0:00')
  })
  it('formata duração longa', () => {
    expect(formatDurationLong(45)).toBe('45 s')
    expect(formatDurationLong(900)).toBe('15 min')
    expect(formatDurationLong(3725)).toBe('1h 02min')
  })
  it('descanso restante nunca é negativo', () => {
    const now = new Date('2026-01-01T10:00:00Z')
    expect(restRemainingSec('2026-01-01T10:01:30Z', now)).toBe(90)
    expect(restRemainingSec('2026-01-01T09:59:00Z', now)).toBe(0)
  })
})
