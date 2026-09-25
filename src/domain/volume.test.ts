import { session, sessionExercise, set } from '@/test/factories'
import { completedWorkSets, exerciseVolume, sessionVolume, topWorkWeight } from './volume'

describe('volume', () => {
  const ex = sessionExercise('bench', [
    set(20, 15, { isWarmup: true }),
    set(60, 10),
    set(60, 8),
    set(70, 5, { completedAt: undefined }),
    { id: 'x', weightKg: null, reps: 10, isWarmup: false, completedAt: '2026-01-01T00:00:00Z' },
  ])

  it('ignora aquecimento, séries não concluídas e séries incompletas', () => {
    expect(exerciseVolume(ex)).toBe(60 * 10 + 60 * 8)
    expect(topWorkWeight(ex)).toBe(60)
  })

  it('soma o volume da sessão', () => {
    const s = session('2026-01-01T10:00:00Z', [ex, sessionExercise('row', [set(50, 10)])])
    expect(sessionVolume(s)).toBe(1080 + 500)
    expect(completedWorkSets(s)).toBe(3)
  })

  it('topWorkWeight é null sem séries de trabalho', () => {
    expect(topWorkWeight(sessionExercise('x', [set(20, 10, { isWarmup: true })]))).toBeNull()
  })
})
