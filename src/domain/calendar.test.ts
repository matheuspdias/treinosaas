import { session } from '@/test/factories'
import { dayKey, monthGrid, parseDayKey, sessionsByDay, startOfWeek, weekStreak } from './calendar'

const at = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h).toISOString()

describe('calendar', () => {
  it('semana começa na segunda', () => {
    expect(dayKey(startOfWeek(new Date(2026, 8, 24)))).toBe('2026-09-21') // quinta → segunda
    expect(dayKey(startOfWeek(new Date(2026, 8, 27)))).toBe('2026-09-21') // domingo → segunda anterior
    expect(dayKey(startOfWeek(new Date(2026, 8, 21)))).toBe('2026-09-21')
  })

  it('dayKey e parseDayKey são inversos', () => {
    expect(dayKey(parseDayKey('2026-02-28'))).toBe('2026-02-28')
  })

  it('agrupa sessões concluídas por dia', () => {
    const map = sessionsByDay([
      session(at(2026, 9, 1), []),
      session(at(2026, 9, 1, 18), []),
      session(at(2026, 9, 2), [], { status: 'in_progress' }),
    ])
    expect(map.get('2026-09-01')).toHaveLength(2)
    expect(map.has('2026-09-02')).toBe(false)
  })

  it('grade do mês tem semanas completas de segunda a domingo', () => {
    const grid = monthGrid(2026, 8) // setembro/2026 começa numa terça
    expect(dayKey(grid[0]![0]!)).toBe('2026-08-31')
    expect(grid.every((w) => w.length === 7)).toBe(true)
    expect(dayKey(grid.at(-1)!.at(-1)!)).toBe('2026-10-04')
  })
})

describe('weekStreak', () => {
  const now = new Date(2026, 8, 24) // quinta, semana de 21/09

  it('conta semanas seguidas até a atual', () => {
    const s = [at(2026, 9, 22), at(2026, 9, 15), at(2026, 9, 9), at(2026, 8, 20)].map((d) =>
      session(d, []),
    )
    expect(weekStreak(s, now)).toEqual({ current: 3, best: 3, thisWeekActive: true })
  })

  it('semana atual sem treino não quebra a sequência', () => {
    const s = [at(2026, 9, 15), at(2026, 9, 9)].map((d) => session(d, []))
    expect(weekStreak(s, now)).toEqual({ current: 2, best: 2, thisWeekActive: false })
  })

  it('semana passada sem treino zera a sequência atual, mas mantém a melhor', () => {
    const s = [at(2026, 9, 8), at(2026, 9, 1), at(2026, 8, 25)].map((d) => session(d, []))
    expect(weekStreak(s, now)).toEqual({ current: 0, best: 3, thisWeekActive: false })
  })

  it('vários treinos na mesma semana contam uma vez', () => {
    const s = [at(2026, 9, 21), at(2026, 9, 22), at(2026, 9, 23)].map((d) => session(d, []))
    expect(weekStreak(s, now).current).toBe(1)
  })

  it('sem treinos', () => {
    expect(weekStreak([], now)).toEqual({ current: 0, best: 0, thisWeekActive: false })
  })
})
