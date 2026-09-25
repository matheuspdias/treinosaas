import { plan, planExercise, session, sessionExercise, set } from '@/test/factories'
import { suggestProgression } from './progression'
import { acceptProgression, createSessionFromPlan, dismissProgression } from './session'

const target = { sets: 3, repMin: 8, repMax: 12, loadKg: 60, restSec: 90, incrementKg: 2.5 }

describe('suggestProgression (dupla progressão)', () => {
  it('sugere subir quando todas as séries atingiram o topo da faixa', () => {
    const last = sessionExercise('bench', [set(60, 12), set(60, 12), set(60, 13)])
    expect(suggestProgression(last, target)).toEqual({ fromKg: 60, toKg: 62.5 })
  })

  it('não sugere se alguma série ficou abaixo do topo', () => {
    const last = sessionExercise('bench', [set(60, 12), set(60, 12), set(60, 11)])
    expect(suggestProgression(last, target)).toBeNull()
  })

  it('não sugere se faltaram séries', () => {
    const last = sessionExercise('bench', [set(60, 12), set(60, 12)])
    expect(suggestProgression(last, target)).toBeNull()
  })

  it('ignora aquecimentos e séries não concluídas', () => {
    const last = sessionExercise('bench', [
      set(20, 5, { isWarmup: true }),
      set(60, 12),
      set(60, 12),
      set(60, 12),
      set(60, 3, { completedAt: undefined }),
    ])
    expect(suggestProgression(last, target)).toEqual({ fromKg: 60, toKg: 62.5 })
  })

  it('usa a maior carga como base', () => {
    const last = sessionExercise('bench', [set(60, 12), set(57.5, 12), set(55, 12)])
    expect(suggestProgression(last, target)?.toKg).toBe(62.5)
  })

  it('não sugere sem histórico, sem incremento, sem carga ou se a ficha já foi aumentada', () => {
    const last = sessionExercise('bench', [set(60, 12), set(60, 12), set(60, 12)])
    expect(suggestProgression(undefined, target)).toBeNull()
    expect(suggestProgression(last, { ...target, incrementKg: 0 })).toBeNull()
    expect(suggestProgression(last, { ...target, loadKg: 62.5 })).toBeNull()
    const bodyweight = sessionExercise('pullup', [set(0, 12), set(0, 12), set(0, 12)])
    expect(suggestProgression(bodyweight, target)).toBeNull()
  })

  it('evita lixo de ponto flutuante', () => {
    const last = sessionExercise('bench', [set(22.1, 12), set(22.1, 12), set(22.1, 12)])
    expect(suggestProgression(last, { ...target, loadKg: 22.1, incrementKg: 0.2 })?.toKg).toBe(22.3)
  })
})

describe('sugestão na sessão', () => {
  let n = 0
  const clock = { now: () => new Date('2026-03-01T10:00:00Z'), newId: () => `p${++n}` }
  const pe = planExercise('bench', { sets: 2, loadKg: 60, repMax: 10 })
  const p = plan('A', 0, { exercises: [pe] })
  const history = [
    session('2026-02-20T10:00:00Z', [sessionExercise('bench', [set(60, 10), set(60, 10)])]),
  ]

  it('é anexada ao criar a sessão e pode ser aceita', () => {
    const s = createSessionFromPlan({ plan: p, history, resolveName: () => 'Supino', clock })
    const ex = s.exercises[0]!
    expect(ex.progression).toEqual({ fromKg: 60, toKg: 62.5, status: 'pending' })
    const accepted = acceptProgression(s, ex.id)
    expect(accepted.exercises[0]!.progression?.status).toBe('accepted')
    expect(accepted.exercises[0]!.sets.map((x) => x.weightKg)).toEqual([62.5, 62.5])
  })

  it('aceitar não altera séries já concluídas nem aquecimentos', () => {
    const s = createSessionFromPlan({ plan: p, history, resolveName: () => 'Supino', clock })
    const ex = s.exercises[0]!
    const withDone = {
      ...s,
      exercises: [
        {
          ...ex,
          sets: [
            { ...ex.sets[0]!, completedAt: 'x' },
            ex.sets[1]!,
            { id: 'w', weightKg: 20, reps: 10, isWarmup: true },
          ],
        },
      ],
    }
    expect(acceptProgression(withDone, ex.id).exercises[0]!.sets.map((x) => x.weightKg)).toEqual([
      60, 62.5, 20,
    ])
  })

  it('pode ser ignorada', () => {
    const s = createSessionFromPlan({ plan: p, history, resolveName: () => 'Supino', clock })
    const ex = s.exercises[0]!
    const d = dismissProgression(s, ex.id)
    expect(d.exercises[0]!.progression?.status).toBe('dismissed')
    expect(d.exercises[0]!.sets.map((x) => x.weightKg)).toEqual([60, 60])
  })
})
