import { PLAN_COLORS } from './types'
import type { ExerciseRef, ID, Plan, PlanColor, PlanExercise, Settings } from './types'

export const PLAN_LIMITS = {
  sets: { min: 1, max: 20 },
  reps: { min: 1, max: 100 },
  restSec: { min: 0, max: 600 },
  loadKg: { min: 0, max: 1000 },
  incrementKg: { min: 0, max: 50 },
} as const

export function createPlan(
  input: { name: string; color?: PlanColor; order: number },
  newId: () => ID = () => crypto.randomUUID(),
  now: string = new Date().toISOString(),
): Plan {
  return {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    name: input.name.trim(),
    color: input.color ?? PLAN_COLORS[input.order % PLAN_COLORS.length]!,
    order: input.order,
    exercises: [],
  }
}

export function createPlanExercise(
  exercise: ExerciseRef,
  defaults: Pick<Settings, 'defaultRestSec' | 'defaultIncrementKg'>,
  newId: () => ID = () => crypto.randomUUID(),
): PlanExercise {
  return {
    id: newId(),
    exercise,
    sets: 3,
    repMin: 8,
    repMax: 12,
    loadKg: 0,
    restSec: defaults.defaultRestSec,
    incrementKg: defaults.defaultIncrementKg,
    notes: '',
  }
}

/** Cópia independente (novos ids), inserida no fim da sequência. */
export function duplicatePlan(
  plan: Plan,
  order: number,
  newId: () => ID = () => crypto.randomUUID(),
  now: string = new Date().toISOString(),
): Plan {
  const { archivedAt: _archived, deletedAt: _deleted, ...rest } = plan
  return {
    ...rest,
    id: newId(),
    name: `${plan.name} (cópia)`,
    order,
    createdAt: now,
    updatedAt: now,
    exercises: plan.exercises.map((e) => ({ ...e, id: newId() })),
  }
}

export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const copy = [...items]
  const [moved] = copy.splice(from, 1)
  if (moved === undefined) return copy
  copy.splice(to, 0, moved)
  return copy
}

/** Garante repMin ≤ repMax e valores dentro dos limites. */
export function sanitizeTarget<T extends Partial<PlanExercise>>(patch: T): T {
  const out = { ...patch }
  const clamp = (v: number, { min, max }: { min: number; max: number }) =>
    Math.min(max, Math.max(min, v))
  if (out.sets !== undefined) out.sets = Math.round(clamp(out.sets, PLAN_LIMITS.sets))
  if (out.repMin !== undefined) out.repMin = Math.round(clamp(out.repMin, PLAN_LIMITS.reps))
  if (out.repMax !== undefined) out.repMax = Math.round(clamp(out.repMax, PLAN_LIMITS.reps))
  if (out.restSec !== undefined) out.restSec = Math.round(clamp(out.restSec, PLAN_LIMITS.restSec))
  if (out.loadKg !== undefined) out.loadKg = clamp(out.loadKg, PLAN_LIMITS.loadKg)
  if (out.incrementKg !== undefined)
    out.incrementKg = clamp(out.incrementKg, PLAN_LIMITS.incrementKg)
  return out
}
