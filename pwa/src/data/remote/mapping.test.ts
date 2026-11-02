import { plan, session, sessionExercise, set } from '@/test/factories'
import {
  archiveAllAcademyPlans,
  programsToPlans,
  reconcileAcademyPlans,
  sessionToRemote,
} from './mapping'
import { assessmentsResponseSchema, programsResponseSchema } from './schemas'
import type { RemoteProgram } from './schemas'

const NOW = '2026-11-02T12:00:00.000Z'

function program(overrides: Partial<RemoteProgram> = {}): RemoteProgram {
  return {
    id: 'prog-1',
    name: 'Hipertrofia ABC',
    notes: 'Foco em técnica',
    author: 'Prof. Rafa',
    startsOn: '2026-11-01',
    expiresOn: '2026-12-13',
    expired: false,
    isNew: true,
    updatedAt: '2026-11-01T10:00:00.000Z',
    plans: [
      {
        id: 'plan-b',
        name: 'Treino B',
        color: 'cyan',
        position: 1,
        exercises: [],
      },
      {
        id: 'plan-a',
        name: 'Treino A',
        color: 'lime',
        position: 0,
        exercises: [
          {
            id: 'ex-1',
            exercise: { source: 'catalog', id: 'Barbell_Squat' },
            exerciseName: 'Agachamento livre',
            sets: 4,
            repMin: 12,
            repMax: 8,
            loadKg: 60,
            restSec: 90,
            incrementKg: 2.5,
            notes: 'Desça até 90°',
          },
        ],
      },
    ],
    ...overrides,
  }
}

describe('programsToPlans', () => {
  it('vira fichas da academia com os ids do servidor, em ordem e com a observação', () => {
    const plans = programsToPlans([program()], new Map(), NOW)
    expect(plans.map((p) => p.id)).toEqual(['plan-a', 'plan-b'])
    const [a] = plans
    expect(a).toMatchObject({
      origin: 'academy',
      order: 0,
      createdAt: NOW,
      academy: { programId: 'prog-1', author: 'Prof. Rafa', isNew: true, expiresOn: '2026-12-13' },
    })
    expect(a!.exercises[0]).toMatchObject({
      id: 'ex-1',
      repMin: 8,
      repMax: 12,
      notes: 'Desça até 90°',
    })
    expect(plans[1]!.order).toBe(1)
  })

  it('mantém o createdAt local e respeita o "visto" que ainda está na fila', () => {
    const existing = new Map([['plan-a', plan('x', 0, { id: 'plan-a', createdAt: 'antes' })]])
    const [a] = programsToPlans([program()], existing, NOW, new Set(['prog-1']))
    expect(a!.createdAt).toBe('antes')
    expect(a!.academy!.isNew).toBe(false)
  })

  it('separa programas diferentes na ordem', () => {
    const plans = programsToPlans(
      [program(), program({ id: 'prog-2', plans: [{ ...program().plans[1]!, id: 'p2' }] })],
      new Map(),
      NOW,
    )
    expect(plans.find((p) => p.id === 'p2')!.order).toBeGreaterThanOrEqual(100)
  })
})

describe('reconcileAcademyPlans', () => {
  const incoming = programsToPlans([program()], new Map(), NOW)

  it('grava as novas e nada quando não mudou', () => {
    expect(reconcileAcademyPlans([], incoming, NOW)).toHaveLength(2)
    expect(reconcileAcademyPlans(incoming, incoming, NOW)).toHaveLength(0)
  })

  it('arquiva a ficha que sumiu do servidor e reativa a que voltou', () => {
    const gone = { ...incoming[0]!, id: 'old' }
    const archivedBack = { ...incoming[1]!, archivedAt: 'ontem' }
    const changed = reconcileAcademyPlans([incoming[0]!, archivedBack, gone], incoming, NOW)
    expect(changed.find((p) => p.id === 'old')!.archivedAt).toBe(NOW)
    expect(changed.find((p) => p.id === archivedBack.id)!.archivedAt).toBeUndefined()
  })

  it('nunca mexe nas fichas do usuário', () => {
    const own = plan('Minha', 0)
    expect(reconcileAcademyPlans([own], [], NOW)).toEqual([])
    expect(archiveAllAcademyPlans([own, ...incoming], NOW).map((p) => p.id)).toEqual([
      'plan-a',
      'plan-b',
    ])
  })
})

describe('sessionToRemote', () => {
  it('envia a sessão no formato do app, sem campos internos', () => {
    const s = session('2026-11-02T10:00:00.000Z', [
      sessionExercise(
        'Barbell_Squat',
        [set(60, 10), set(20, 10, { isWarmup: true, completedAt: undefined })],
        {
          planExerciseId: 'ex-1',
        },
      ),
    ])
    const remote = sessionToRemote(s)
    expect(remote).toMatchObject({ id: s.id, planId: 'plan-a', finishedAt: s.finishedAt })
    expect(remote.exercises[0]!.planExerciseId).toBe('ex-1')
    expect(remote.exercises[0]!.sets[0]).toEqual({
      weightKg: 60,
      reps: 10,
      isWarmup: false,
      completedAt: '2026-01-01T10:00:00.000Z',
    })
    expect(remote.exercises[0]!.sets[1]).not.toHaveProperty('completedAt')
    expect(remote.exercises[0]!.sets[0]).not.toHaveProperty('id')
  })
})

describe('schemas', () => {
  const rawExercise = {
    id: 'ex-1',
    exercise: { source: 'catalog', id: 'Barbell_Squat' },
    exerciseName: 'Agachamento',
    sets: 3,
    repMin: 8,
    repMax: 12,
    loadKg: 40,
    restSec: 90,
    incrementKg: 2.5,
    notes: null,
  }

  it('aceita cor desconhecida (painel mais novo) e observação nula', () => {
    const parsed = programsResponseSchema.parse({
      syncedAt: NOW,
      programs: [
        {
          ...program(),
          plans: [{ id: 'p', name: 'A', color: 'teal', position: 0, exercises: [rawExercise] }],
        },
      ],
    })
    const parsedPlan = parsed.programs[0]!.plans[0]!
    expect(parsedPlan.color).toBe('lime')
    expect(parsedPlan.exercises[0]!.notes).toBe('')
  })

  it('aceita medidas vazias vindas do PHP como lista', () => {
    const parsed = assessmentsResponseSchema.parse({
      assessments: [
        {
          id: 'a',
          assessedOn: '2026-11-01',
          weightKg: 80,
          heightCm: null,
          bodyFatPct: null,
          measurementsCm: [],
          notes: null,
        },
        {
          id: 'b',
          assessedOn: '2026-10-01',
          weightKg: null,
          heightCm: 175,
          bodyFatPct: 18,
          measurementsCm: { waist: 82, inventada: 1 },
          notes: 'ok',
        },
      ],
    })
    expect(parsed.assessments[0]!.measurementsCm).toEqual({})
    expect(parsed.assessments[1]!.measurementsCm).toEqual({ waist: 82 })
  })
})
