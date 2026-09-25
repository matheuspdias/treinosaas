import { addDays, startOfWeek } from './calendar'
import { MUSCLE_GROUPS, muscleGroupOf } from './muscles'
import type { MuscleGroupId } from './muscles'
import type { ExerciseRef, Muscle, Session } from './types'
import { isWorkSet } from './volume'

export interface WeekCount {
  weekStart: Date
  count: number
}

/** Treinos por semana nas últimas `weeks` semanas (a atual é a última). */
export function workoutsPerWeek(
  sessions: readonly Session[],
  weeks: number,
  now: Date = new Date(),
): WeekCount[] {
  const current = startOfWeek(now)
  const buckets: WeekCount[] = Array.from({ length: weeks }, (_, i) => ({
    weekStart: addDays(current, -7 * (weeks - 1 - i)),
    count: 0,
  }))
  const index = new Map(buckets.map((b, i) => [b.weekStart.getTime(), i]))
  for (const s of sessions) {
    if (s.status !== 'completed') continue
    const i = index.get(startOfWeek(new Date(s.startedAt)).getTime())
    if (i !== undefined) buckets[i]!.count++
  }
  return buckets
}

export type MuscleLookup = (
  ref: ExerciseRef,
) => { primary: readonly Muscle[]; secondary: readonly Muscle[] } | undefined

export interface MuscleGroupWork {
  group: MuscleGroupId
  label: string
  /** Séries de trabalho; músculos auxiliares contam meia série. */
  sets: number
  volumeKg: number
}

/**
 * Trabalho por grupo muscular entre `from` (inclusive) e `to` (exclusive).
 * Músculo principal conta a série inteira; auxiliar conta metade. Cada grupo conta uma vez por série.
 */
export function workByMuscleGroup(
  sessions: readonly Session[],
  muscleOf: MuscleLookup,
  from: Date,
  to: Date,
): MuscleGroupWork[] {
  const acc = new Map<MuscleGroupId, { sets: number; volumeKg: number }>()
  for (const s of sessions) {
    const t = new Date(s.startedAt).getTime()
    if (s.status !== 'completed' || t < from.getTime() || t >= to.getTime()) continue
    for (const ex of s.exercises) {
      const muscles = muscleOf(ex.exercise)
      if (!muscles) continue
      const weights = new Map<MuscleGroupId, number>()
      for (const m of muscles.secondary) {
        const g = muscleGroupOf(m)
        if (g) weights.set(g, 0.5)
      }
      for (const m of muscles.primary) {
        const g = muscleGroupOf(m)
        if (g) weights.set(g, 1)
      }
      for (const set of ex.sets) {
        if (!isWorkSet(set)) continue
        for (const [g, w] of weights) {
          const cur = acc.get(g) ?? { sets: 0, volumeKg: 0 }
          cur.sets += w
          cur.volumeKg += w * set.weightKg * set.reps
          acc.set(g, cur)
        }
      }
    }
  }
  return MUSCLE_GROUPS.filter((g) => acc.has(g.id))
    .map((g) => ({ group: g.id, label: g.label, ...acc.get(g.id)! }))
    .sort((a, b) => b.sets - a.sets || b.volumeKg - a.volumeKg)
}

/**
 * Grupos principais sem nenhuma série nos últimos `days` dias.
 * Só faz sentido se houve treino no período; senão retorna lista vazia.
 */
export function neglectedMuscleGroups(
  sessions: readonly Session[],
  muscleOf: MuscleLookup,
  now: Date = new Date(),
  days = 14,
): { group: MuscleGroupId; label: string }[] {
  const from = addDays(now, -days)
  const recent = sessions.filter((s) => s.status === 'completed' && new Date(s.startedAt) >= from)
  if (recent.length === 0) return []
  const trained = new Set(
    workByMuscleGroup(recent, muscleOf, from, addDays(now, 1))
      .filter((w) => w.sets >= 1)
      .map((w) => w.group),
  )
  return MUSCLE_GROUPS.filter((g) => g.major && !trained.has(g.id)).map((g) => ({
    group: g.id,
    label: g.label,
  }))
}
