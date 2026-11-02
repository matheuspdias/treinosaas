import { session, sessionExercise, set } from '@/test/factories'
import { compareSessions, findPreviousSessionOfPlan } from './comparison'

describe('comparison', () => {
  const prevA = session('2026-01-01T10:00:00Z', [sessionExercise('bench', [set(60, 10)])])
  const otherPlan = session('2026-01-03T10:00:00Z', [sessionExercise('bench', [set(10, 1)])], {
    planId: 'plan-b',
  })
  const current = session('2026-01-08T10:00:00Z', [
    sessionExercise('bench', [set(60, 10), set(60, 10)]),
    sessionExercise('fly', [set(10, 10)]),
  ])

  it('encontra a sessão anterior da mesma ficha', () => {
    expect(findPreviousSessionOfPlan(current, [prevA, otherPlan, current])).toBe(prevA)
    expect(findPreviousSessionOfPlan(prevA, [prevA, current])).toBeUndefined()
  })

  it('compara volume total e por exercício', () => {
    const c = compareSessions(current, prevA)
    expect(c.volume).toBe(1300)
    expect(c.previousVolume).toBe(600)
    expect(c.volumeChange).toBeCloseTo(700 / 600)
    expect(c.exercises[0]).toMatchObject({
      volume: 1200,
      previousVolume: 600,
      topWeight: 60,
      previousTopWeight: 60,
    })
    expect(c.exercises[1]).toMatchObject({ volume: 100, previousVolume: null })
  })

  it('sem anterior, os campos de comparação ficam nulos', () => {
    const c = compareSessions(current, undefined)
    expect(c.previousVolume).toBeNull()
    expect(c.volumeChange).toBeNull()
  })
})
