import { epley1RM } from './oneRepMax'
import { exerciseKey } from './records'
import type { ExerciseRef, ID, ISODate, Session, SetLog } from './types'
import { isWorkSet } from './volume'

export interface ExerciseHistoryPoint {
  sessionId: ID
  date: ISODate
  planName: string
  maxWeightKg: number
  e1rmKg: number
  volumeKg: number
  workSets: (SetLog & { weightKg: number; reps: number })[]
}

/** Uma entrada por sessão em que o exercício teve séries de trabalho, da mais antiga para a mais recente. */
export function exerciseHistory(
  sessions: readonly Session[],
  ref: ExerciseRef,
): ExerciseHistoryPoint[] {
  const key = exerciseKey(ref)
  const points: ExerciseHistoryPoint[] = []
  for (const session of sessions) {
    if (session.status !== 'completed') continue
    const workSets = session.exercises
      .filter((e) => exerciseKey(e.exercise) === key)
      .flatMap((e) => e.sets.filter(isWorkSet))
    if (workSets.length === 0) continue
    points.push({
      sessionId: session.id,
      date: session.startedAt,
      planName: session.planName,
      maxWeightKg: Math.max(...workSets.map((s) => s.weightKg)),
      e1rmKg: Math.max(...workSets.map((s) => epley1RM(s.weightKg, s.reps))),
      volumeKg: workSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0),
      workSets,
    })
  }
  return points.sort((a, b) => a.date.localeCompare(b.date))
}

export interface RecordEntry {
  value: number
  date: ISODate
  sessionId: ID
  /** Série que gerou o recorde. */
  weightKg: number
  reps: number
}

export interface PersonalRecords {
  exercise: ExerciseRef
  exerciseName: string
  weight: RecordEntry
  e1rm: RecordEntry
  setVolume: RecordEntry
  lastDate: ISODate
}

/** Recordes pessoais de cada exercício já treinado, com a data em que foram feitos. */
export function personalRecords(sessions: readonly Session[]): PersonalRecords[] {
  const byKey = new Map<string, PersonalRecords>()
  const ordered = [...sessions]
    .filter((s) => s.status === 'completed')
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
  for (const session of ordered) {
    for (const ex of session.exercises) {
      for (const set of ex.sets) {
        if (!isWorkSet(set)) continue
        const key = exerciseKey(ex.exercise)
        const entry = (value: number): RecordEntry => ({
          value,
          date: session.startedAt,
          sessionId: session.id,
          weightKg: set.weightKg,
          reps: set.reps,
        })
        const weight = set.weightKg
        const e1rm = epley1RM(set.weightKg, set.reps)
        const vol = set.weightKg * set.reps
        const current = byKey.get(key)
        if (!current) {
          byKey.set(key, {
            exercise: ex.exercise,
            exerciseName: ex.exerciseName,
            weight: entry(weight),
            e1rm: entry(e1rm),
            setVolume: entry(vol),
            lastDate: session.startedAt,
          })
          continue
        }
        current.exerciseName = ex.exerciseName
        current.lastDate = session.startedAt
        // Estritamente maior: em caso de empate vale a primeira vez que a marca foi feita.
        if (weight > current.weight.value) current.weight = entry(weight)
        if (e1rm > current.e1rm.value) current.e1rm = entry(e1rm)
        if (vol > current.setVolume.value) current.setVolume = entry(vol)
      }
    }
  }
  return [...byKey.values()].sort((a, b) => b.lastDate.localeCompare(a.lastDate))
}
