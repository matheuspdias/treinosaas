import { repos } from '@/data'
import type { CustomExercise, Plan } from '@/domain/types'
import type { SharedPlan } from './shareCodec'

/**
 * Cria no app de quem recebeu: os exercícios personalizados (ids novos) e a ficha,
 * no fim da sequência. Nada existente é alterado.
 */
export async function importSharedPlan(shared: SharedPlan): Promise<Plan> {
  const now = new Date().toISOString()
  const plans = await repos.plans.list()
  const idMap = new Map<string, string>()
  for (const x of shared.x ?? []) {
    const custom: CustomExercise = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      name: x.n,
      primaryMuscles: x.m,
      secondaryMuscles: [],
      equipment: x.q,
      instructions: x.t,
      ...(x.y ? { media: { kind: 'youtube' as const, videoId: x.y } } : {}),
    }
    await repos.customExercises.save(custom)
    idMap.set(x.i, custom.id)
  }
  const plan: Plan = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    name: shared.n,
    color: shared.c,
    order: plans.reduce((max, p) => Math.max(max, p.order + 1), 0),
    exercises: shared.e.map(
      ([source, id, sets, repMin, repMax, loadKg, restSec, incrementKg, notes]) => ({
        id: crypto.randomUUID(),
        exercise: { source, id: source === 'custom' ? (idMap.get(id) ?? id) : id },
        sets,
        repMin: Math.min(repMin, repMax),
        repMax: Math.max(repMin, repMax),
        loadKg,
        restSec,
        incrementKg,
        notes,
      }),
    ),
  }
  await repos.plans.save(plan)
  await repos.settings.update({ onboardingDone: true })
  return plan
}
