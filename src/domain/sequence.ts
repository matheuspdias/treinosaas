import type { ID, Plan } from './types'

export function isActivePlan(plan: Plan): boolean {
  return !plan.archivedAt && !plan.deletedAt
}

export function sortByOrder<T extends { order: number }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order)
}

/**
 * Próxima ficha da sequência (A → B → C → A).
 *
 * `plans` deve incluir as arquivadas: se a última ficha feita foi arquivada depois,
 * a sequência continua a partir da posição dela.
 */
export function nextPlanInSequence(
  plans: readonly Plan[],
  lastCompletedPlanId: ID | null,
): Plan | null {
  const active = sortByOrder(plans.filter(isActivePlan))
  if (active.length === 0) return null
  const last = lastCompletedPlanId ? plans.find((p) => p.id === lastCompletedPlanId) : undefined
  if (!last) return active[0]!
  return active.find((p) => p.order > last.order) ?? active[0]!
}

/** Renumera `order` de forma contígua (0, 1, 2...) após reordenar. */
export function reindex<T extends { order: number }>(items: readonly T[]): T[] {
  return items.map((item, index) => (item.order === index ? item : { ...item, order: index }))
}
