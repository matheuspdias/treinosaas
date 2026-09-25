import { session, sessionExercise, set } from '@/test/factories'
import { exerciseHistory, personalRecords } from './history'

describe('exerciseHistory', () => {
  const s1 = session('2026-01-08T10:00:00Z', [
    sessionExercise('bench', [set(20, 10, { isWarmup: true }), set(60, 10), set(62.5, 8)]),
  ])
  const s0 = session('2026-01-01T10:00:00Z', [sessionExercise('bench', [set(55, 10)])])
  const other = session('2026-01-05T10:00:00Z', [sessionExercise('squat', [set(100, 5)])])
  const active = session('2026-01-10T10:00:00Z', [sessionExercise('bench', [set(99, 9)])], {
    status: 'in_progress',
  })

  it('lista sessões em ordem cronológica com carga máxima, 1RM e volume', () => {
    const h = exerciseHistory([s1, other, s0, active], { source: 'catalog', id: 'bench' })
    expect(h.map((p) => p.sessionId)).toEqual([s0.id, s1.id])
    expect(h[1]).toMatchObject({ maxWeightKg: 62.5, volumeKg: 600 + 500 })
    expect(h[1]!.e1rmKg).toBeCloseTo(80, 6) // 60×10 = 80 > 62,5×8 = 79,17
    expect(h[1]!.workSets).toHaveLength(2)
  })

  it('junta o mesmo exercício repetido na sessão', () => {
    const twice = session('2026-01-02T10:00:00Z', [
      sessionExercise('bench', [set(50, 10)]),
      sessionExercise('bench', [set(70, 3)]),
    ])
    const [p] = exerciseHistory([twice], { source: 'catalog', id: 'bench' })
    expect(p).toMatchObject({ maxWeightKg: 70, volumeKg: 710 })
  })
})

describe('personalRecords', () => {
  it('guarda a data e a série de cada recorde; empate mantém a primeira vez', () => {
    const a = session('2026-01-01T10:00:00Z', [sessionExercise('bench', [set(80, 5)])])
    const b = session('2026-01-08T10:00:00Z', [sessionExercise('bench', [set(80, 5), set(70, 12)])])
    const [pr] = personalRecords([b, a])
    expect(pr!.weight).toMatchObject({ value: 80, sessionId: a.id })
    expect(pr!.setVolume).toMatchObject({ value: 840, sessionId: b.id, weightKg: 70, reps: 12 })
    expect(pr!.lastDate).toBe(b.startedAt)
  })
})
