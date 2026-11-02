import { repos } from '@/data'
import { isAcademyPlan, userPlans } from '@/domain/academy'
import {
  createPlan,
  createPlanExercise,
  duplicatePlan,
  moveItem,
  sanitizeTarget,
} from '@/domain/plan'
import { isActivePlan, reindex, sortByOrder } from '@/domain/sequence'
import { sequenceLetter } from '@/domain/text'
import type { ExerciseRef, ID, Plan, PlanColor, PlanExercise } from '@/domain/types'
import { instantiateTemplate } from '@/templates/instantiate'
import type { WorkoutTemplate } from '@/templates/templates'

const now = () => new Date().toISOString()

/** Fichas da academia são só leitura: nenhuma ação de edição as altera. */
async function mutatePlan(id: ID, fn: (plan: Plan) => Plan): Promise<Plan | undefined> {
  const plan = await repos.plans.get(id)
  if (!plan || isAcademyPlan(plan)) return undefined
  const next = { ...fn(plan), updatedAt: now() }
  await repos.plans.save(next)
  return next
}

export async function createNextPlan(color?: PlanColor): Promise<Plan> {
  const plans = await repos.plans.list()
  // A letra (Treino A, B...) conta só as fichas do próprio usuário.
  const activeCount = userPlans(plans).filter(isActivePlan).length
  const order = plans.reduce((max, p) => Math.max(max, p.order + 1), 0)
  const plan = createPlan({
    name: `Treino ${sequenceLetter(activeCount)}`,
    order,
    ...(color ? { color } : {}),
  })
  await repos.plans.save(plan)
  return plan
}

export async function renamePlan(id: ID, name: string): Promise<void> {
  await mutatePlan(id, (p) => ({ ...p, name: name.trim() || p.name }))
}

export async function setPlanColor(id: ID, color: PlanColor): Promise<void> {
  await mutatePlan(id, (p) => ({ ...p, color }))
}

export async function duplicatePlanById(id: ID): Promise<Plan | undefined> {
  const plans = await repos.plans.list()
  const source = plans.find((p) => p.id === id)
  if (!source) return undefined
  const order = plans.reduce((max, p) => Math.max(max, p.order + 1), 0)
  const copy = duplicatePlan(source, order)
  await repos.plans.save(copy)
  return copy
}

export async function archivePlan(id: ID, archived: boolean): Promise<void> {
  await mutatePlan(id, (p) => {
    if (archived) return { ...p, archivedAt: now() }
    const { archivedAt: _a, ...rest } = p
    return rest
  })
}

export async function deletePlan(id: ID): Promise<void> {
  const plan = await repos.plans.get(id)
  if (!plan || isAcademyPlan(plan)) return
  await repos.plans.remove(id)
}

/** Reordena as fichas ativas (as arquivadas mantêm sua posição relativa no fim). */
export async function reorderActivePlans(orderedActiveIds: ID[]): Promise<void> {
  const plans = sortByOrder(userPlans(await repos.plans.list()))
  const byId = new Map(plans.map((p) => [p.id, p]))
  const active = orderedActiveIds.map((id) => byId.get(id)).filter((p): p is Plan => !!p)
  const rest = plans.filter((p) => !orderedActiveIds.includes(p.id))
  const stamp = now()
  const changed = reindex([...active, ...rest]).filter((p) => byId.get(p.id)?.order !== p.order)
  await repos.plans.saveMany(changed.map((p) => ({ ...p, updatedAt: stamp })))
}

export async function addExercisesToPlan(id: ID, refs: ExerciseRef[]): Promise<void> {
  const settings = await repos.settings.get()
  await mutatePlan(id, (p) => ({
    ...p,
    exercises: [...p.exercises, ...refs.map((ref) => createPlanExercise(ref, settings))],
  }))
}

export async function updatePlanExercise(
  planId: ID,
  exerciseId: ID,
  patch: Partial<Omit<PlanExercise, 'id' | 'exercise'>>,
): Promise<void> {
  await mutatePlan(planId, (p) => ({
    ...p,
    exercises: p.exercises.map((e) => {
      if (e.id !== exerciseId) return e
      const next = { ...e, ...sanitizeTarget(patch) }
      // Mantém a faixa coerente: quem foi editado "empurra" o outro.
      if (next.repMin > next.repMax) {
        if (patch.repMin !== undefined) next.repMax = next.repMin
        else next.repMin = next.repMax
      }
      return next
    }),
  }))
}

export async function removePlanExercise(
  planId: ID,
  exerciseId: ID,
): Promise<PlanExercise | undefined> {
  let removed: PlanExercise | undefined
  await mutatePlan(planId, (p) => {
    removed = p.exercises.find((e) => e.id === exerciseId)
    return { ...p, exercises: p.exercises.filter((e) => e.id !== exerciseId) }
  })
  return removed
}

export async function restorePlanExercise(
  planId: ID,
  exercise: PlanExercise,
  index: number,
): Promise<void> {
  await mutatePlan(planId, (p) => {
    const exercises = [...p.exercises]
    exercises.splice(Math.min(index, exercises.length), 0, exercise)
    return { ...p, exercises }
  })
}

export async function reorderPlanExercises(planId: ID, from: number, to: number): Promise<void> {
  await mutatePlan(planId, (p) => ({ ...p, exercises: moveItem(p.exercises, from, to) }))
}

/** Cria as fichas de um modelo no fim da sequência e marca o onboarding como feito. */
export async function applyTemplate(template: WorkoutTemplate): Promise<Plan[]> {
  const [plans, settings, existingCustom] = await Promise.all([
    repos.plans.list(),
    repos.settings.get(),
    repos.customExercises.list(),
  ])
  const startOrder = plans.reduce((max, p) => Math.max(max, p.order + 1), 0)
  const created = instantiateTemplate(template, { startOrder, defaults: settings, existingCustom })
  // Exercícios personalizados antes das fichas: nenhuma ficha aponta para exercício inexistente.
  for (const c of created.customExercises) await repos.customExercises.save(c)
  await repos.plans.saveMany(created.plans)
  await repos.settings.update({ onboardingDone: true })
  return created.plans
}
