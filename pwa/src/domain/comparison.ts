import { exerciseKey } from './records'
import type { Session } from './types'
import { exerciseVolume, sessionVolume, topWorkWeight } from './volume'
import { sessionDurationSec } from './duration'

export interface ExerciseComparison {
  key: string
  name: string
  volume: number
  previousVolume: number | null
  topWeight: number | null
  previousTopWeight: number | null
}

export interface SessionComparison {
  volume: number
  previousVolume: number | null
  /** Variação percentual do volume (0,1 = +10%). Null se não houver anterior ou ele for zero. */
  volumeChange: number | null
  durationSec: number
  previousDurationSec: number | null
  exercises: ExerciseComparison[]
}

/** A sessão concluída mais recente da mesma ficha, anterior a `session`. */
export function findPreviousSessionOfPlan(
  session: Session,
  history: readonly Session[],
): Session | undefined {
  return history
    .filter(
      (s) =>
        s.id !== session.id &&
        s.planId === session.planId &&
        s.status === 'completed' &&
        s.startedAt < session.startedAt,
    )
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
}

export function compareSessions(
  current: Session,
  previous: Session | undefined,
): SessionComparison {
  const volume = sessionVolume(current)
  const previousVolume = previous ? sessionVolume(previous) : null
  return {
    volume,
    previousVolume,
    volumeChange: previousVolume ? (volume - previousVolume) / previousVolume : null,
    durationSec: sessionDurationSec(current),
    previousDurationSec: previous ? sessionDurationSec(previous) : null,
    exercises: current.exercises.map((e) => {
      const key = exerciseKey(e.exercise)
      const prev = previous?.exercises.find((p) => exerciseKey(p.exercise) === key)
      return {
        key,
        name: e.exerciseName,
        volume: exerciseVolume(e),
        previousVolume: prev ? exerciseVolume(prev) : null,
        topWeight: topWorkWeight(e),
        previousTopWeight: prev ? topWorkWeight(prev) : null,
      }
    }),
  }
}
