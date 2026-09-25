import type { Plan, PlanExercise, Session, SessionExercise, SetLog } from '@/domain/types'

let seq = 0
export const id = (): string => `id-${++seq}`

export function set(weightKg: number, reps: number, opts: Partial<SetLog> = {}): SetLog {
  return {
    id: id(),
    weightKg,
    reps,
    isWarmup: false,
    completedAt: '2026-01-01T10:00:00.000Z',
    ...opts,
  }
}

export function planExercise(
  exerciseId: string,
  overrides: Partial<PlanExercise> = {},
): PlanExercise {
  return {
    id: id(),
    exercise: { source: 'catalog', id: exerciseId },
    sets: 3,
    repMin: 8,
    repMax: 12,
    loadKg: 40,
    restSec: 90,
    incrementKg: 2.5,
    notes: '',
    ...overrides,
  }
}

export function plan(name: string, order: number, overrides: Partial<Plan> = {}): Plan {
  return {
    id: id(),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    name,
    color: 'lime',
    order,
    exercises: [],
    ...overrides,
  }
}

export function sessionExercise(
  exerciseId: string,
  sets: SetLog[],
  overrides: Partial<SessionExercise> = {},
): SessionExercise {
  return {
    id: id(),
    exercise: { source: 'catalog', id: exerciseId },
    exerciseName: exerciseId,
    target: { sets: 3, repMin: 8, repMax: 12, loadKg: 40, restSec: 90, incrementKg: 2.5 },
    notes: '',
    sets,
    ...overrides,
  }
}

export function session(
  startedAt: string,
  exercises: SessionExercise[],
  overrides: Partial<Session> = {},
): Session {
  return {
    id: id(),
    createdAt: startedAt,
    updatedAt: startedAt,
    planId: 'plan-a',
    planName: 'Treino A',
    planColor: 'lime',
    status: 'completed',
    startedAt,
    finishedAt: new Date(new Date(startedAt).getTime() + 3600_000).toISOString(),
    currentExerciseIndex: 0,
    rest: null,
    exercises,
    ...overrides,
  }
}
