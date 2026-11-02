import type { ExerciseTarget, SessionExercise } from './types'
import { roundKg } from './units'
import { isWorkSet } from './volume'

/**
 * Dupla progressão: se na última vez TODAS as séries de trabalho previstas chegaram ao topo
 * da faixa de repetições, sugere subir a carga pelo incremento do exercício.
 *
 * Não sugere quando: não há histórico, faltaram séries, alguma série ficou abaixo do topo,
 * o exercício é sem carga (peso corporal), o incremento é zero, ou a carga da ficha
 * já foi aumentada manualmente até o valor sugerido.
 */
export function suggestProgression(
  last: SessionExercise | undefined,
  target: ExerciseTarget,
): { fromKg: number; toKg: number } | null {
  if (!last || target.incrementKg <= 0) return null
  const work = last.sets.filter(isWorkSet)
  if (work.length === 0 || work.length < target.sets) return null
  if (!work.every((s) => s.reps >= target.repMax)) return null
  const fromKg = Math.max(...work.map((s) => s.weightKg))
  if (fromKg <= 0) return null
  const toKg = roundKg(fromKg + target.incrementKg)
  if (target.loadKg >= toKg) return null
  return { fromKg, toKg }
}
