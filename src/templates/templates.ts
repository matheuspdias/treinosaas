import type { PlanColor } from '@/domain/types'

/**
 * Modelos de treino prontos. São código estático: só viram fichas do usuário
 * quando ele escolhe um modelo (onboarding ou tela de fichas). Cargas começam em 0.
 */

/** [id do catálogo, séries, reps mín., reps máx., descanso em s] */
export type TemplateExercise = readonly [string, number, number, number, number]

export interface TemplatePlan {
  name: string
  color: PlanColor
  focus: string
  exercises: readonly TemplateExercise[]
}

export interface WorkoutTemplate {
  id: 'abc' | 'abcd' | 'fullbody' | 'upperlower'
  name: string
  description: string
  frequency: string
  level: string
  plans: readonly TemplatePlan[]
}

export const TEMPLATES: readonly WorkoutTemplate[] = [
  {
    id: 'abc',
    name: 'ABC',
    description: 'O clássico das academias: cada grupo muscular num dia.',
    frequency: '3 a 6 dias por semana',
    level: 'Iniciante a intermediário',
    plans: [
      {
        name: 'Treino A',
        color: 'lime',
        focus: 'Peito, ombros e tríceps',
        exercises: [
          ['Barbell_Bench_Press_-_Medium_Grip', 4, 6, 10, 120],
          ['Incline_Dumbbell_Press', 3, 8, 12, 90],
          ['Butterfly', 3, 10, 15, 60],
          ['Dumbbell_Shoulder_Press', 3, 8, 12, 90],
          ['Side_Lateral_Raise', 3, 12, 15, 60],
          ['Triceps_Pushdown_-_Rope_Attachment', 3, 10, 15, 60],
          ['EZ-Bar_Skullcrusher', 3, 10, 12, 60],
        ],
      },
      {
        name: 'Treino B',
        color: 'cyan',
        focus: 'Costas e bíceps',
        exercises: [
          ['Wide-Grip_Lat_Pulldown', 4, 8, 12, 90],
          ['Bent_Over_Barbell_Row', 3, 6, 10, 120],
          ['Seated_Cable_Rows', 3, 8, 12, 90],
          ['One-Arm_Dumbbell_Row', 3, 8, 12, 60],
          ['Face_Pull', 3, 12, 15, 60],
          ['Barbell_Curl', 3, 8, 12, 60],
          ['Hammer_Curls', 3, 10, 12, 60],
        ],
      },
      {
        name: 'Treino C',
        color: 'violet',
        focus: 'Pernas e abdômen',
        exercises: [
          ['Barbell_Squat', 4, 6, 10, 150],
          ['Leg_Press', 3, 10, 12, 120],
          ['Romanian_Deadlift', 3, 8, 10, 120],
          ['Leg_Extensions', 3, 12, 15, 60],
          ['Lying_Leg_Curls', 3, 10, 12, 60],
          ['Standing_Calf_Raises', 4, 12, 20, 60],
          ['Cable_Crunch', 3, 12, 15, 60],
        ],
      },
    ],
  },
  {
    id: 'abcd',
    name: 'ABCD',
    description: 'Mais volume por grupo, com um dia só para ombros.',
    frequency: '4 dias por semana',
    level: 'Intermediário',
    plans: [
      {
        name: 'Treino A',
        color: 'lime',
        focus: 'Peito e tríceps',
        exercises: [
          ['Barbell_Bench_Press_-_Medium_Grip', 4, 6, 10, 120],
          ['Incline_Dumbbell_Press', 3, 8, 12, 90],
          ['Cable_Crossover', 3, 12, 15, 60],
          ['Triceps_Pushdown', 3, 10, 12, 60],
          ['Standing_Dumbbell_Triceps_Extension', 3, 10, 12, 60],
        ],
      },
      {
        name: 'Treino B',
        color: 'cyan',
        focus: 'Costas e bíceps',
        exercises: [
          ['Wide-Grip_Lat_Pulldown', 4, 8, 12, 90],
          ['T-Bar_Row_with_Handle', 3, 8, 10, 120],
          ['Seated_Cable_Rows', 3, 10, 12, 90],
          ['Barbell_Curl', 3, 8, 12, 60],
          ['Incline_Dumbbell_Curl', 3, 10, 12, 60],
        ],
      },
      {
        name: 'Treino C',
        color: 'violet',
        focus: 'Pernas',
        exercises: [
          ['Barbell_Squat', 4, 6, 10, 150],
          ['Leg_Press', 3, 10, 12, 120],
          ['Split_Squat_with_Dumbbells', 3, 8, 12, 90],
          ['Leg_Extensions', 3, 12, 15, 60],
          ['Lying_Leg_Curls', 3, 10, 12, 60],
          ['Seated_Calf_Raise', 4, 12, 20, 60],
        ],
      },
      {
        name: 'Treino D',
        color: 'orange',
        focus: 'Ombros e abdômen',
        exercises: [
          ['Standing_Military_Press', 4, 6, 10, 120],
          ['Side_Lateral_Raise', 4, 12, 15, 60],
          ['Reverse_Machine_Flyes', 3, 12, 15, 60],
          ['Barbell_Shrug', 3, 10, 15, 60],
          ['Hanging_Leg_Raise', 3, 10, 15, 60],
          ['Ab_Crunch_Machine', 3, 12, 15, 60],
        ],
      },
    ],
  },
  {
    id: 'fullbody',
    name: 'Full Body',
    description: 'Corpo inteiro em cada treino, alternando A e B. Ótimo para quem tem pouco tempo.',
    frequency: '2 a 3 dias por semana',
    level: 'Iniciante',
    plans: [
      {
        name: 'Full Body A',
        color: 'emerald',
        focus: 'Corpo inteiro',
        exercises: [
          ['Barbell_Squat', 3, 6, 10, 150],
          ['Barbell_Bench_Press_-_Medium_Grip', 3, 6, 10, 120],
          ['Bent_Over_Barbell_Row', 3, 8, 10, 120],
          ['Dumbbell_Shoulder_Press', 3, 8, 12, 90],
          ['Barbell_Curl', 2, 10, 12, 60],
          ['Triceps_Pushdown', 2, 10, 12, 60],
        ],
      },
      {
        name: 'Full Body B',
        color: 'blue',
        focus: 'Corpo inteiro',
        exercises: [
          ['Romanian_Deadlift', 3, 8, 10, 120],
          ['Incline_Dumbbell_Press', 3, 8, 12, 90],
          ['Wide-Grip_Lat_Pulldown', 3, 8, 12, 90],
          ['Leg_Press', 3, 10, 12, 120],
          ['Side_Lateral_Raise', 3, 12, 15, 60],
          ['Cable_Crunch', 3, 12, 15, 60],
        ],
      },
    ],
  },
  {
    id: 'upperlower',
    name: 'Upper / Lower',
    description: 'Superiores e inferiores alternados: cada grupo treina duas vezes por semana.',
    frequency: '4 dias por semana',
    level: 'Intermediário',
    plans: [
      {
        name: 'Superior A',
        color: 'blue',
        focus: 'Membros superiores (força)',
        exercises: [
          ['Barbell_Bench_Press_-_Medium_Grip', 4, 5, 8, 150],
          ['Bent_Over_Barbell_Row', 4, 6, 8, 120],
          ['Dumbbell_Shoulder_Press', 3, 8, 10, 90],
          ['Wide-Grip_Lat_Pulldown', 3, 8, 12, 90],
          ['Barbell_Curl', 2, 8, 12, 60],
          ['Triceps_Pushdown', 2, 10, 12, 60],
        ],
      },
      {
        name: 'Inferior A',
        color: 'red',
        focus: 'Membros inferiores (força)',
        exercises: [
          ['Barbell_Squat', 4, 5, 8, 180],
          ['Romanian_Deadlift', 3, 6, 10, 120],
          ['Leg_Press', 3, 10, 12, 120],
          ['Lying_Leg_Curls', 3, 10, 12, 60],
          ['Standing_Calf_Raises', 4, 10, 15, 60],
        ],
      },
      {
        name: 'Superior B',
        color: 'cyan',
        focus: 'Membros superiores (volume)',
        exercises: [
          ['Incline_Dumbbell_Press', 3, 8, 12, 90],
          ['Seated_Cable_Rows', 3, 10, 12, 90],
          ['Arnold_Dumbbell_Press', 3, 10, 12, 90],
          ['Close-Grip_Front_Lat_Pulldown', 3, 10, 12, 90],
          ['Hammer_Curls', 3, 10, 12, 60],
          ['EZ-Bar_Skullcrusher', 3, 10, 12, 60],
        ],
      },
      {
        name: 'Inferior B',
        color: 'orange',
        focus: 'Membros inferiores (volume)',
        exercises: [
          ['Barbell_Deadlift', 3, 5, 8, 180],
          ['Hack_Squat', 3, 8, 12, 120],
          ['Split_Squat_with_Dumbbells', 3, 10, 12, 90],
          ['Seated_Leg_Curl', 3, 10, 15, 60],
          ['Seated_Calf_Raise', 4, 12, 20, 60],
          ['Hanging_Leg_Raise', 3, 10, 15, 60],
        ],
      },
    ],
  },
]

export function getTemplate(id: string): WorkoutTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id)
}
