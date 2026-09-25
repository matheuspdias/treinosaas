import { isActivePlan, sortByOrder } from '@/domain/sequence'
import { sequenceLetter } from '@/domain/text'
import type { Plan } from '@/domain/types'

/** Letra de cada ficha ativa pela posição na sequência; arquivadas ficam com "–". */
export function planLetters(plans: readonly Plan[]): Map<string, string> {
  const map = new Map<string, string>()
  sortByOrder(plans.filter(isActivePlan)).forEach((p, i) => map.set(p.id, sequenceLetter(i)))
  plans.filter((p) => !isActivePlan(p)).forEach((p) => map.set(p.id, '–'))
  return map
}
