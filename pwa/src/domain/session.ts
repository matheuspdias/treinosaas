import type { ExerciseRef, ID, ISODate, Plan, Session, SessionExercise, SetLog } from './types'
import { suggestProgression } from './progression'
import { exerciseKey } from './records'
import { isWorkSet, topWorkWeight } from './volume'

export interface Clock {
  now: () => Date
  newId: () => ID
}

export const systemClock: Clock = {
  now: () => new Date(),
  newId: () => crypto.randomUUID(),
}

/**
 * Última execução de um exercício com ao menos uma série de trabalho concluída.
 * `completedSessions` pode vir em qualquer ordem.
 */
export function findLastPerformance(
  completedSessions: readonly Session[],
  ref: ExerciseRef,
): SessionExercise | undefined {
  const key = exerciseKey(ref)
  const sorted = [...completedSessions]
    .filter((s) => s.status === 'completed')
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  for (const session of sorted) {
    const match = session.exercises.find(
      (e) => exerciseKey(e.exercise) === key && e.sets.some(isWorkSet),
    )
    if (match) return match
  }
  return undefined
}

/**
 * Séries pré-preenchidas para um exercício da ficha.
 *
 * - Com histórico: repete aquecimentos e as cargas/reps de cada série da última vez.
 * - Se a carga da ficha foi alterada manualmente (difere da maior carga da última vez),
 *   a carga da ficha vale para todas as séries de trabalho.
 * - Sem histórico: carga da ficha e reps no topo da faixa.
 */
export function prefillSets(
  target: Plan['exercises'][number],
  last: SessionExercise | undefined,
  newId: () => ID,
): SetLog[] {
  const blank = (weightKg: number | null, reps: number | null, isWarmup = false): SetLog => ({
    id: newId(),
    weightKg,
    reps,
    isWarmup,
  })

  if (!last) {
    return Array.from({ length: target.sets }, () => blank(target.loadKg, target.repMax))
  }

  const lastWarmups = last.sets.filter((s) => s.isWarmup && s.completedAt)
  const lastWork = last.sets.filter(isWorkSet)
  const loadChangedInPlan = topWorkWeight(last) !== target.loadKg

  const warmups = lastWarmups.map((s) => blank(s.weightKg, s.reps, true))
  const work = Array.from({ length: target.sets }, (_, i) => {
    const prev = lastWork[i] ?? lastWork[lastWork.length - 1]
    const weight = loadChangedInPlan || !prev ? target.loadKg : prev.weightKg
    return blank(weight, prev?.reps ?? target.repMax)
  })
  return [...warmups, ...work]
}

export interface StartSessionInput {
  plan: Plan
  history: readonly Session[]
  resolveName: (ref: ExerciseRef) => string
  clock?: Clock
}

export function createSessionFromPlan({
  plan,
  history,
  resolveName,
  clock = systemClock,
}: StartSessionInput): Session {
  const now = clock.now().toISOString()
  return {
    id: clock.newId(),
    createdAt: now,
    updatedAt: now,
    planId: plan.id,
    planName: plan.name,
    planColor: plan.color,
    status: 'in_progress',
    startedAt: now,
    currentExerciseIndex: 0,
    rest: null,
    exercises: plan.exercises.map((pe) => {
      const last = findLastPerformance(history, pe.exercise)
      const suggestion = suggestProgression(last, pe)
      return {
        id: clock.newId(),
        planExerciseId: pe.id,
        exercise: pe.exercise,
        exerciseName: resolveName(pe.exercise),
        notes: pe.notes,
        target: {
          sets: pe.sets,
          repMin: pe.repMin,
          repMax: pe.repMax,
          loadKg: pe.loadKg,
          restSec: pe.restSec,
          incrementKg: pe.incrementKg,
        },
        sets: prefillSets(pe, last, clock.newId),
        ...(suggestion ? { progression: { ...suggestion, status: 'pending' as const } } : {}),
      }
    }),
  }
}

// ---------------------------------------------------------------------------
// Atualizações imutáveis da sessão em andamento
// ---------------------------------------------------------------------------

function touch(session: Session, now: ISODate): Session {
  return { ...session, updatedAt: now }
}

function mapExercise(
  session: Session,
  exerciseId: ID,
  fn: (e: SessionExercise) => SessionExercise,
): SessionExercise[] {
  return session.exercises.map((e) => (e.id === exerciseId ? fn(e) : e))
}

export function updateSet(
  session: Session,
  exerciseId: ID,
  setId: ID,
  patch: Partial<Pick<SetLog, 'weightKg' | 'reps' | 'isWarmup'>>,
  now: ISODate = new Date().toISOString(),
): Session {
  return touch(
    {
      ...session,
      exercises: mapExercise(session, exerciseId, (e) => ({
        ...e,
        sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
      })),
    },
    now,
  )
}

/** Marca/desmarca a série como concluída. Ao concluir, inicia o descanso (exceto aquecimento sem descanso). */
export function toggleSetDone(
  session: Session,
  exerciseId: ID,
  setId: ID,
  now: Date = new Date(),
): Session {
  const exercise = session.exercises.find((e) => e.id === exerciseId)
  const set = exercise?.sets.find((s) => s.id === setId)
  if (!exercise || !set) return session
  const iso = now.toISOString()
  const completing = !set.completedAt
  const next: Session = {
    ...session,
    exercises: mapExercise(session, exerciseId, (e) => ({
      ...e,
      sets: e.sets.map((s) => {
        if (s.id !== setId) return s
        if (completing) return { ...s, completedAt: iso }
        const { completedAt: _drop, ...rest } = s
        return rest
      }),
    })),
  }
  const restSec = exercise.target.restSec
  if (completing && restSec > 0) {
    next.rest = {
      endsAt: new Date(now.getTime() + restSec * 1000).toISOString(),
      durationSec: restSec,
    }
  }
  return touch(next, iso)
}

export function addSet(
  session: Session,
  exerciseId: ID,
  isWarmup: boolean,
  newId: () => ID = () => crypto.randomUUID(),
  now: ISODate = new Date().toISOString(),
): Session {
  return touch(
    {
      ...session,
      exercises: mapExercise(session, exerciseId, (e) => {
        const template = isWarmup
          ? e.sets.find((s) => s.isWarmup)
          : [...e.sets].reverse().find((s) => !s.isWarmup)
        const set: SetLog = {
          id: newId(),
          weightKg: template?.weightKg ?? (isWarmup ? null : e.target.loadKg),
          reps: template?.reps ?? (isWarmup ? null : e.target.repMax),
          isWarmup,
        }
        if (isWarmup) {
          const lastWarmupIndex = e.sets.findLastIndex((s) => s.isWarmup)
          const sets = [...e.sets]
          sets.splice(lastWarmupIndex + 1, 0, set)
          return { ...e, sets }
        }
        return { ...e, sets: [...e.sets, set] }
      }),
    },
    now,
  )
}

export function removeSet(
  session: Session,
  exerciseId: ID,
  setId: ID,
  now: ISODate = new Date().toISOString(),
): Session {
  return touch(
    {
      ...session,
      exercises: mapExercise(session, exerciseId, (e) => ({
        ...e,
        sets: e.sets.filter((s) => s.id !== setId),
      })),
    },
    now,
  )
}

export function setRest(
  session: Session,
  rest: Session['rest'],
  now: ISODate = new Date().toISOString(),
): Session {
  return touch({ ...session, rest }, now)
}

/** Soma (ou subtrai) segundos do descanso atual. */
export function adjustRest(session: Session, deltaSec: number, now: Date = new Date()): Session {
  if (!session.rest) return session
  const endsAt = new Date(new Date(session.rest.endsAt).getTime() + deltaSec * 1000)
  if (endsAt <= now) return setRest(session, null, now.toISOString())
  return setRest(
    session,
    { endsAt: endsAt.toISOString(), durationSec: Math.max(0, session.rest.durationSec + deltaSec) },
    now.toISOString(),
  )
}

export function goToExercise(
  session: Session,
  index: number,
  now: ISODate = new Date().toISOString(),
): Session {
  const clamped = Math.min(Math.max(0, index), session.exercises.length - 1)
  return touch({ ...session, currentExerciseIndex: clamped }, now)
}

/** Aceita a sugestão: séries de trabalho ainda não feitas passam para a nova carga. */
export function acceptProgression(
  session: Session,
  exerciseId: ID,
  now: ISODate = new Date().toISOString(),
): Session {
  return touch(
    {
      ...session,
      exercises: mapExercise(session, exerciseId, (e) => {
        if (!e.progression) return e
        const toKg = e.progression.toKg
        return {
          ...e,
          progression: { ...e.progression, status: 'accepted' },
          sets: e.sets.map((s) => (s.isWarmup || s.completedAt ? s : { ...s, weightKg: toKg })),
        }
      }),
    },
    now,
  )
}

export function dismissProgression(
  session: Session,
  exerciseId: ID,
  now: ISODate = new Date().toISOString(),
): Session {
  return touch(
    {
      ...session,
      exercises: mapExercise(session, exerciseId, (e) =>
        e.progression ? { ...e, progression: { ...e.progression, status: 'dismissed' } } : e,
      ),
    },
    now,
  )
}

/**
 * Encerra a sessão. Séries não concluídas são descartadas (não contam como feitas),
 * exercícios sem nenhuma série concluída são removidos do registro.
 */
export function finishSession(session: Session, now: Date = new Date()): Session {
  const iso = now.toISOString()
  return {
    ...session,
    status: 'completed',
    finishedAt: iso,
    updatedAt: iso,
    rest: null,
    exercises: session.exercises
      .map((e) => ({ ...e, sets: e.sets.filter((s) => s.completedAt) }))
      .filter((e) => e.sets.length > 0),
  }
}

export function hasAnyCompletedSet(session: Session): boolean {
  return session.exercises.some((e) => e.sets.some((s) => s.completedAt))
}

/** Atualiza a "carga atual" da ficha com a maior carga de trabalho usada em cada exercício. */
export function syncPlanLoads(plan: Plan, session: Session, now: ISODate): Plan {
  let changed = false
  const exercises = plan.exercises.map((pe) => {
    const done = session.exercises.find((e) => e.planExerciseId === pe.id)
    const top = done ? topWorkWeight(done) : null
    if (top === null || top === pe.loadKg) return pe
    changed = true
    return { ...pe, loadKg: top }
  })
  return changed ? { ...plan, exercises, updatedAt: now } : plan
}
