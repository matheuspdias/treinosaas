import { isActivePlan, nextPlanInSequence, sortByOrder } from './sequence'
import type { ID, Plan, Session } from './types'

/** Ficha recebida da academia: o aluno só treina com ela, não edita. */
export function isAcademyPlan(plan: Pick<Plan, 'origin'>): boolean {
  return plan.origin === 'academy'
}

export function userPlans(plans: readonly Plan[]): Plan[] {
  return plans.filter((p) => !isAcademyPlan(p))
}

export function academyPlans(plans: readonly Plan[]): Plan[] {
  return plans.filter(isAcademyPlan)
}

/**
 * Próximo treino sugerido. Com treino da academia ativo, segue a sequência das fichas da
 * academia; sem ele, a sequência das fichas do usuário (comportamento de sempre).
 *
 * `history`: sessões concluídas, mais recentes primeiro.
 */
export function nextSuggestedPlan(
  plans: readonly Plan[],
  history: readonly Session[],
): Plan | null {
  const academy = academyPlans(plans)
  // Sem nenhuma ficha da academia: exatamente o comportamento de sempre.
  if (academy.length === 0) return nextPlanInSequence(plans, history[0]?.planId ?? null)
  const useAcademy = academy.some(isActivePlan)
  const group = useAcademy ? academy : userPlans(plans)
  const ids = new Set(group.map((p) => p.id))
  const last = history.find((s) => ids.has(s.planId))
  return nextPlanInSequence(group, last?.planId ?? null)
}

/** Fichas ativas para listar: as da academia primeiro (na sequência delas), depois as do usuário. */
export function orderedActivePlans(plans: readonly Plan[]): Plan[] {
  return [
    ...sortByOrder(academyPlans(plans).filter(isActivePlan)),
    ...sortByOrder(userPlans(plans).filter(isActivePlan)),
  ]
}

/** Treinos (programas) da academia ativos, na ordem das fichas. */
export function activeAcademyPrograms(
  plans: readonly Plan[],
): { programId: ID; plans: Plan[]; info: NonNullable<Plan['academy']> }[] {
  const groups = new Map<ID, Plan[]>()
  for (const p of sortByOrder(academyPlans(plans).filter(isActivePlan))) {
    if (!p.academy) continue
    const list = groups.get(p.academy.programId) ?? []
    list.push(p)
    groups.set(p.academy.programId, list)
  }
  return [...groups.entries()].map(([programId, list]) => ({
    programId,
    plans: list,
    info: list[0]!.academy!,
  }))
}

// ---------------------------------------------------------------------------
// Celular
// ---------------------------------------------------------------------------

/** Só os dígitos nacionais (DDD + número), no máximo 11. Remove +55 colado. */
export function phoneDigits(input: string): string {
  let d = input.replace(/\D/g, '')
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2)
  return d.slice(0, 11)
}

/** Máscara progressiva enquanto digita: (11) 91234-5678. */
export function formatPhoneInput(input: string): string {
  const d = phoneDigits(input)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Celular completo: DDD + 9 + 8 dígitos (a validação definitiva é do servidor). */
export function isCompletePhone(input: string): boolean {
  const d = phoneDigits(input)
  return d.length === 11 && d[2] === '9' && Number(d.slice(0, 2)) >= 11
}

/** PIN de 4 a 6 números, sem repetidos (1111) nem sequências (1234, 4321). */
export function pinProblem(pin: string): string | null {
  if (!/^\d{4,6}$/.test(pin)) return 'O PIN deve ter de 4 a 6 números.'
  if (new Set(pin).size === 1) return 'Evite números repetidos.'
  if ('0123456789'.includes(pin) || '9876543210'.includes(pin)) return 'Evite números em sequência.'
  return null
}
