import type { Session, SessionExercise, SetLog } from './types'

/** Série válida para estatísticas: concluída, não é aquecimento, com carga e reps. */
export function isWorkSet(set: SetLog): set is SetLog & { weightKg: number; reps: number } {
  return (
    !set.isWarmup && set.completedAt !== undefined && set.weightKg !== null && set.reps !== null
  )
}

export function setVolume(set: SetLog): number {
  return isWorkSet(set) ? set.weightKg * set.reps : 0
}

export function exerciseVolume(exercise: SessionExercise): number {
  return exercise.sets.reduce((sum, s) => sum + setVolume(s), 0)
}

export function sessionVolume(session: Session): number {
  return session.exercises.reduce((sum, e) => sum + exerciseVolume(e), 0)
}

export function completedWorkSets(session: Session): number {
  return session.exercises.reduce((n, e) => n + e.sets.filter(isWorkSet).length, 0)
}

export function topWorkWeight(exercise: SessionExercise): number | null {
  const weights = exercise.sets.filter(isWorkSet).map((s) => s.weightKg)
  return weights.length ? Math.max(...weights) : null
}
