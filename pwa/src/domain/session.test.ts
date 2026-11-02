import { plan, planExercise, session, sessionExercise, set } from '@/test/factories'
import {
  addSet,
  adjustRest,
  createSessionFromPlan,
  findLastPerformance,
  finishSession,
  prefillSets,
  syncPlanLoads,
  toggleSetDone,
} from './session'

let n = 0
const newId = () => `n${++n}`
const clock = { now: () => new Date('2026-02-01T10:00:00Z'), newId }

describe('findLastPerformance', () => {
  it('encontra a execução mais recente com séries de trabalho', () => {
    const older = session('2026-01-01T10:00:00Z', [sessionExercise('bench', [set(60, 10)])])
    const newer = session('2026-01-08T10:00:00Z', [sessionExercise('bench', [set(62.5, 10)])])
    const onlyWarmup = session('2026-01-15T10:00:00Z', [
      sessionExercise('bench', [set(20, 10, { isWarmup: true })]),
    ])
    const found = findLastPerformance([older, onlyWarmup, newer], {
      source: 'catalog',
      id: 'bench',
    })
    expect(found?.sets[0]?.weightKg).toBe(62.5)
  })

  it('ignora sessões em andamento', () => {
    const inProgress = session('2026-01-20T10:00:00Z', [sessionExercise('bench', [set(99, 1)])], {
      status: 'in_progress',
    })
    expect(findLastPerformance([inProgress], { source: 'catalog', id: 'bench' })).toBeUndefined()
  })
})

describe('prefillSets', () => {
  it('sem histórico usa a carga da ficha e o topo da faixa', () => {
    const sets = prefillSets(
      planExercise('bench', { sets: 3, loadKg: 40, repMax: 12 }),
      undefined,
      newId,
    )
    expect(sets).toHaveLength(3)
    expect(sets.every((s) => s.weightKg === 40 && s.reps === 12 && !s.completedAt)).toBe(true)
  })

  it('com histórico repete cargas, reps e aquecimentos da última vez', () => {
    const last = sessionExercise('bench', [
      set(20, 15, { isWarmup: true }),
      set(60, 10),
      set(60, 9),
      set(57.5, 8),
    ])
    const sets = prefillSets(planExercise('bench', { sets: 3, loadKg: 60 }), last, newId)
    expect(sets.map((s) => [s.weightKg, s.reps, s.isWarmup])).toEqual([
      [20, 15, true],
      [60, 10, false],
      [60, 9, false],
      [57.5, 8, false],
    ])
  })

  it('se a carga da ficha foi alterada, ela vale para todas as séries de trabalho', () => {
    const last = sessionExercise('bench', [set(60, 12), set(60, 12)])
    const sets = prefillSets(planExercise('bench', { sets: 2, loadKg: 62.5 }), last, newId)
    expect(sets.map((s) => s.weightKg)).toEqual([62.5, 62.5])
    expect(sets.map((s) => s.reps)).toEqual([12, 12])
  })

  it('se a ficha tem mais séries que a última vez, repete a última série', () => {
    const last = sessionExercise('bench', [set(60, 10)])
    const sets = prefillSets(planExercise('bench', { sets: 3, loadKg: 60 }), last, newId)
    expect(sets.map((s) => s.reps)).toEqual([10, 10, 10])
  })
})

describe('ciclo da sessão', () => {
  const pe = planExercise('bench', { sets: 2, loadKg: 60, restSec: 90 })
  const p = plan('Treino A', 0, { exercises: [pe] })

  it('cria a sessão a partir da ficha', () => {
    const s = createSessionFromPlan({ plan: p, history: [], resolveName: () => 'Supino', clock })
    expect(s.status).toBe('in_progress')
    expect(s.planName).toBe('Treino A')
    expect(s.exercises[0]?.exerciseName).toBe('Supino')
    expect(s.exercises[0]?.planExerciseId).toBe(pe.id)
    expect(s.exercises[0]?.sets).toHaveLength(2)
  })

  it('concluir série inicia o descanso com horário absoluto', () => {
    const s = createSessionFromPlan({ plan: p, history: [], resolveName: () => 'Supino', clock })
    const ex = s.exercises[0]!
    const done = toggleSetDone(s, ex.id, ex.sets[0]!.id, new Date('2026-02-01T10:05:00Z'))
    expect(done.exercises[0]?.sets[0]?.completedAt).toBe('2026-02-01T10:05:00.000Z')
    expect(done.rest).toEqual({ endsAt: '2026-02-01T10:06:30.000Z', durationSec: 90 })

    const undone = toggleSetDone(done, ex.id, ex.sets[0]!.id)
    expect(undone.exercises[0]?.sets[0]?.completedAt).toBeUndefined()
  })

  it('ajusta o descanso e encerra se zerar', () => {
    const now = new Date('2026-02-01T10:00:00Z')
    const s = {
      ...session('2026-02-01T09:00:00Z', []),
      rest: { endsAt: '2026-02-01T10:00:30Z', durationSec: 60 },
    }
    expect(adjustRest(s, 15, now).rest?.endsAt).toBe('2026-02-01T10:00:45.000Z')
    expect(adjustRest(s, -30, now).rest).toBeNull()
  })

  it('adiciona aquecimento antes das séries de trabalho', () => {
    const s = createSessionFromPlan({ plan: p, history: [], resolveName: () => 'Supino', clock })
    const ex = s.exercises[0]!
    const withWarmup = addSet(s, ex.id, true, newId)
    expect(withWarmup.exercises[0]?.sets.map((x) => x.isWarmup)).toEqual([true, false, false])
    const withWork = addSet(withWarmup, ex.id, false, newId)
    const last = withWork.exercises[0]!.sets.at(-1)!
    expect([last.isWarmup, last.weightKg]).toEqual([false, 60])
  })

  it('finalizar descarta séries e exercícios não feitos', () => {
    const s = session(
      '2026-02-01T09:00:00Z',
      [
        sessionExercise('bench', [set(60, 10), set(60, 10, { completedAt: undefined })]),
        sessionExercise('row', [set(50, 10, { completedAt: undefined })]),
      ],
      { status: 'in_progress', finishedAt: undefined },
    )
    const f = finishSession(s, new Date('2026-02-01T10:00:00Z'))
    expect(f.status).toBe('completed')
    expect(f.finishedAt).toBe('2026-02-01T10:00:00.000Z')
    expect(f.exercises).toHaveLength(1)
    expect(f.exercises[0]?.sets).toHaveLength(1)
  })

  it('sincroniza a carga atual da ficha com a maior carga usada', () => {
    const s = session('2026-02-01T09:00:00Z', [
      sessionExercise('bench', [set(62.5, 10), set(65, 8)], { planExerciseId: pe.id }),
    ])
    const updated = syncPlanLoads(p, s, '2026-02-01T10:00:00Z')
    expect(updated.exercises[0]?.loadKg).toBe(65)
    expect(syncPlanLoads(updated, s, 'x')).toBe(updated)
  })
})
