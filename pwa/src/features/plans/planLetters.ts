import { academyPlans, userPlans } from '@/domain/academy'
import { isActivePlan, sortByOrder } from '@/domain/sequence'
import { sequenceLetter } from '@/domain/text'
import type { Plan } from '@/domain/types'

/**
 * Letra de cada ficha ativa pela posição na sequência; arquivadas ficam com "–".
 * Fichas do usuário e de cada treino da academia têm sequências próprias (A, B, C em cada).
 */
export function planLetters(plans: readonly Plan[]): Map<string, string> {
  const map = new Map<string, string>()
  const byProgram = new Map<string, Plan[]>()
  for (const p of academyPlans(plans)) {
    const key = p.academy?.programId ?? ''
    byProgram.set(key, [...(byProgram.get(key) ?? []), p])
  }
  for (const group of [userPlans(plans), ...byProgram.values()]) {
    sortByOrder(group.filter(isActivePlan)).forEach((p, i) => map.set(p.id, sequenceLetter(i)))
  }
  plans.filter((p) => !isActivePlan(p)).forEach((p) => map.set(p.id, '–'))
  return map
}
