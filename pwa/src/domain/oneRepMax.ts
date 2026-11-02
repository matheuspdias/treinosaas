/**
 * 1RM estimado pela fórmula de Epley: carga × (1 + reps / 30).
 * Com 1 repetição, o 1RM é a própria carga. Sem repetições ou carga, 0.
 */
export function epley1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0
  if (reps === 1) return weightKg
  return weightKg * (1 + reps / 30)
}
