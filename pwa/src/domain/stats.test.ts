import { session, sessionExercise, set } from '@/test/factories'
import { neglectedMuscleGroups, workByMuscleGroup, workoutsPerWeek } from './stats'
import type { MuscleLookup } from './stats'

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 10).toISOString()
const muscles: Record<string, { primary: string[]; secondary: string[] }> = {
  bench: { primary: ['chest'], secondary: ['triceps', 'shoulders'] },
  row: { primary: ['middle back', 'lats'], secondary: ['biceps'] },
  squat: { primary: ['quadriceps'], secondary: ['glutes', 'hamstrings'] },
}
const lookup = ((ref) => muscles[ref.id]) as MuscleLookup

describe('workoutsPerWeek', () => {
  it('conta treinos por semana, com a semana atual por último', () => {
    const now = new Date(2026, 8, 24)
    const s = [at(2026, 9, 22), at(2026, 9, 23), at(2026, 9, 10), at(2026, 1, 1)].map((d) =>
      session(d, []),
    )
    const weeks = workoutsPerWeek(s, 4, now)
    expect(weeks.map((w) => w.count)).toEqual([0, 1, 0, 2])
    expect(weeks.at(-1)!.weekStart.getDate()).toBe(21)
  })
})

describe('workByMuscleGroup', () => {
  const s = session(at(2026, 9, 22), [
    sessionExercise('bench', [set(60, 10), set(60, 10), set(20, 10, { isWarmup: true })]),
    sessionExercise('row', [set(50, 10)]),
  ])

  it('principal conta série inteira e auxiliar meia; lats + meio das costas contam uma vez', () => {
    const w = workByMuscleGroup([s], lookup, new Date(2026, 8, 21), new Date(2026, 8, 28))
    const by = Object.fromEntries(w.map((x) => [x.group, x]))
    expect(by.chest).toMatchObject({ sets: 2, volumeKg: 1200 })
    expect(by.triceps).toMatchObject({ sets: 1, volumeKg: 600 })
    expect(by.back).toMatchObject({ sets: 1, volumeKg: 500 })
    expect(by.biceps).toMatchObject({ sets: 0.5 })
    expect(w[0]!.group).toBe('chest')
  })

  it('respeita o período', () => {
    expect(workByMuscleGroup([s], lookup, new Date(2026, 8, 28), new Date(2026, 9, 5))).toEqual([])
  })
})

describe('neglectedMuscleGroups', () => {
  const now = new Date(2026, 8, 24)
  it('lista grupos principais sem séries nos últimos 14 dias', () => {
    const s = [
      session(at(2026, 9, 20), [
        sessionExercise('bench', [set(60, 10), set(60, 10)]),
        sessionExercise('squat', [set(100, 5), set(100, 5)]),
      ]),
    ]
    const labels = neglectedMuscleGroups(s, lookup, now).map((g) => g.label)
    expect(labels).toContain('Costas')
    expect(labels).toContain('Bíceps')
    expect(labels).not.toContain('Peito')
    expect(labels).not.toContain('Tríceps') // 2 séries × 0,5
    expect(labels).not.toContain('Trapézio') // não é grupo principal
  })

  it('sem treinos no período, não acusa nada', () => {
    expect(neglectedMuscleGroups([session(at(2026, 1, 1), [])], lookup, now)).toEqual([])
  })
})
