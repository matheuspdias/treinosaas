import type { Muscle } from './types'

/** Grupos musculares usados nas estatísticas (agregam os músculos do catálogo). */
export const MUSCLE_GROUPS = [
  { id: 'chest', label: 'Peito', muscles: ['chest'], major: true },
  { id: 'back', label: 'Costas', muscles: ['lats', 'middle back'], major: true },
  { id: 'shoulders', label: 'Ombros', muscles: ['shoulders'], major: true },
  { id: 'biceps', label: 'Bíceps', muscles: ['biceps'], major: true },
  { id: 'triceps', label: 'Tríceps', muscles: ['triceps'], major: true },
  { id: 'quads', label: 'Quadríceps', muscles: ['quadriceps'], major: true },
  { id: 'hamstrings', label: 'Posteriores', muscles: ['hamstrings'], major: true },
  { id: 'glutes', label: 'Glúteos', muscles: ['glutes'], major: true },
  { id: 'calves', label: 'Panturrilhas', muscles: ['calves'], major: true },
  { id: 'abs', label: 'Abdômen', muscles: ['abdominals'], major: true },
  { id: 'traps', label: 'Trapézio', muscles: ['traps'], major: false },
  { id: 'lowerBack', label: 'Lombar', muscles: ['lower back'], major: false },
  { id: 'forearms', label: 'Antebraço', muscles: ['forearms'], major: false },
  { id: 'hips', label: 'Adutores e abdutores', muscles: ['adductors', 'abductors'], major: false },
  { id: 'neck', label: 'Pescoço', muscles: ['neck'], major: false },
] as const satisfies readonly {
  id: string
  label: string
  muscles: readonly Muscle[]
  major: boolean
}[]

export type MuscleGroupId = (typeof MUSCLE_GROUPS)[number]['id']

const groupOfMuscle = new Map<Muscle, MuscleGroupId>(
  MUSCLE_GROUPS.flatMap((g) => g.muscles.map((m) => [m as Muscle, g.id] as const)),
)

export function muscleGroupOf(muscle: Muscle): MuscleGroupId | undefined {
  return groupOfMuscle.get(muscle)
}
