import { epley1RM } from './oneRepMax'
import type { ExerciseRef, Session } from './types'
import { isWorkSet } from './volume'

export type RecordType = 'weight' | 'e1rm' | 'setVolume'

export const RECORD_LABEL: Record<RecordType, string> = {
  weight: 'Maior carga',
  e1rm: 'Maior 1RM estimado',
  setVolume: 'Maior volume numa série',
}

export interface ExerciseBests {
  weight: number
  e1rm: number
  setVolume: number
}

export interface BrokenRecord {
  exercise: ExerciseRef
  exerciseName: string
  type: RecordType
  value: number
  previous: number
}

export function exerciseKey(ref: ExerciseRef): string {
  return `${ref.source}:${ref.id}`
}

const EMPTY: ExerciseBests = { weight: 0, e1rm: 0, setVolume: 0 }

/** Melhores marcas por exercício (chave `source:id`) considerando só séries de trabalho concluídas. */
export function computeBests(sessions: readonly Session[]): Map<string, ExerciseBests> {
  const bests = new Map<string, ExerciseBests>()
  for (const session of sessions) {
    for (const ex of session.exercises) {
      const key = exerciseKey(ex.exercise)
      const current = { ...(bests.get(key) ?? EMPTY) }
      let touched = false
      for (const set of ex.sets) {
        if (!isWorkSet(set)) continue
        touched = true
        current.weight = Math.max(current.weight, set.weightKg)
        current.e1rm = Math.max(current.e1rm, epley1RM(set.weightKg, set.reps))
        current.setVolume = Math.max(current.setVolume, set.weightKg * set.reps)
      }
      if (touched) bests.set(key, current)
    }
  }
  return bests
}

/**
 * Recordes batidos em `session` em relação ao histórico anterior.
 * Exercício feito pela primeira vez não conta como recorde (não há o que superar).
 */
export function detectBrokenRecords(session: Session, history: readonly Session[]): BrokenRecord[] {
  const previous = computeBests(history.filter((s) => s.id !== session.id))
  const current = computeBests([session])
  const result: BrokenRecord[] = []
  const seen = new Set<string>()

  for (const ex of session.exercises) {
    const key = exerciseKey(ex.exercise)
    if (seen.has(key)) continue
    seen.add(key)
    const before = previous.get(key)
    const now = current.get(key)
    if (!before || !now) continue
    for (const type of ['weight', 'e1rm', 'setVolume'] as const) {
      if (now[type] > before[type] + 1e-9) {
        result.push({
          exercise: ex.exercise,
          exerciseName: ex.exerciseName,
          type,
          value: now[type],
          previous: before[type],
        })
      }
    }
  }
  return result
}
