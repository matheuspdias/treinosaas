import type { Equipment, Muscle, PlanColor } from '@/domain/types'

/**
 * Modelos de treino prontos. São código estático: só viram fichas do usuário
 * quando ele escolhe um modelo (onboarding ou tela de fichas). Cargas começam em 0.
 */

export interface TemplateExerciseOptions {
  notes?: string
  /** Substitui o incremento padrão. 0 em peso corporal: progride por variação, não por carga. */
  incrementKg?: number
}

/**
 * [id, séries, reps mín., reps máx., descanso em s, opções?]
 * O id é do catálogo ou a `key` de um exercício em `customExercises` do modelo.
 */
export type TemplateExercise = readonly [
  string,
  number,
  number,
  number,
  number,
  TemplateExerciseOptions?,
]

/** Exercício fora do catálogo: vira um exercício personalizado do usuário ao aplicar o modelo. */
export interface TemplateCustomExercise {
  /** Id local ao modelo (kebab-case, não colide com ids do catálogo). */
  key: string
  name: string
  primaryMuscles: readonly Muscle[]
  secondaryMuscles: readonly Muscle[]
  equipment: Equipment | null
  instructions: string
}

export interface TemplatePlan {
  name: string
  color: PlanColor
  focus: string
  exercises: readonly TemplateExercise[]
}

export interface WorkoutTemplate {
  id: 'abc' | 'abcd' | 'fullbody' | 'upperlower' | 'calistenia'
  name: string
  description: string
  frequency: string
  level: string
  /** Regras gerais do modelo, mostradas na prévia. */
  guidelines?: readonly string[]
  customExercises?: readonly TemplateCustomExercise[]
  plans: readonly TemplatePlan[]
}

/** Peso corporal: sem sugestão de aumento de carga. */
const BW = { incrementKg: 0 } as const

const CALISTHENICS_PULL: TemplatePlan['exercises'] = [
  ['Scapular_Pull-Up', 3, 10, 10, 90, BW],
  [
    'Pullups',
    3,
    3,
    5,
    120,
    { ...BW, notes: 'Negativa: subir com ajuda (salto ou banco) e descer em 5 segundos ou mais.' },
  ],
  [
    'Band_Assisted_Pull-Up',
    3,
    6,
    8,
    120,
    {
      ...BW,
      notes: 'Gravitron ou elástico. Ao bater 8 reps em todas as séries, reduzir a assistência.',
    },
  ],
  ['Inverted_Row', 3, 10, 12, 90, { ...BW, notes: 'Remada australiana ou na fita de suspensão.' }],
  ['Wide-Grip_Lat_Pulldown', 3, 10, 10, 90],
  ['Barbell_Curl', 3, 10, 12, 90],
  [
    'dead-hang',
    1,
    30,
    60,
    60,
    { ...BW, notes: 'Em segundos, não repetições. Tempo máximo; meta de 30 a 60 segundos.' },
  ],
]

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
  {
    id: 'calistenia',
    name: 'Calistenia Híbrido',
    description: 'Calistenia em casa e força na academia: puxar, empurrar e pernas.',
    frequency: '5 dias por semana',
    level: 'Iniciante',
    guidelines: [
      'Exercícios de força: descanso de 90 a 120 segundos.',
      'Flexão: escolha a variação que dá para fazer com boa técnica dentro da faixa de repetições. Ao passar do limite superior, avance para a próxima (normal → declinada → arqueira).',
      'Quando conseguir 5 barras fixas seguidas, o treino de Puxar pode passar a ser feito em casa, com barra e fita de suspensão.',
      'Prancha e dead hang: as repetições são segundos.',
      'Semana: Puxar (seg), Empurrar (ter), Pernas (qua), descanso (qui), Puxar (sex), Empurrar + Abdômen (sáb), descanso (dom; opcional: caminhada ou cardio leve).',
    ],
    customExercises: [
      {
        key: 'dead-hang',
        name: 'Dead hang (pendurar na barra)',
        primaryMuscles: ['forearms'],
        secondaryMuscles: ['lats', 'shoulders'],
        equipment: 'other',
        instructions:
          'Segure a barra fixa com pegada pronada, na largura dos ombros, e fique pendurado com os braços estendidos pelo maior tempo possível, sem balançar.',
      },
      {
        key: 'pike-push-up',
        name: 'Pike push-up',
        primaryMuscles: ['shoulders'],
        secondaryMuscles: ['triceps'],
        equipment: 'body only',
        instructions:
          'Em V invertido (quadril alto, pernas estendidas), flexione os cotovelos levando a cabeça em direção ao chão, entre as mãos, e empurre de volta.',
      },
      {
        key: 'burpee',
        name: 'Burpee',
        primaryMuscles: ['quadriceps'],
        secondaryMuscles: ['chest', 'shoulders', 'glutes'],
        equipment: 'body only',
        instructions:
          'Agache, apoie as mãos no chão, leve os pés para trás até a prancha, volte os pés e salte com os braços para cima.',
      },
      {
        key: 'jumping-jack',
        name: 'Polichinelo',
        primaryMuscles: ['calves'],
        secondaryMuscles: ['shoulders'],
        equipment: 'body only',
        instructions:
          'Salte abrindo as pernas e levando os braços acima da cabeça; salte de volta à posição inicial.',
      },
    ],
    plans: [
      {
        name: 'Puxar · Academia',
        color: 'cyan',
        focus: 'Segunda: costas, bíceps e pegada',
        exercises: CALISTHENICS_PULL,
      },
      {
        name: 'Empurrar · Casa',
        color: 'orange',
        focus: 'Terça: peito, ombros, tríceps e core',
        exercises: [
          [
            'Pushups',
            4,
            8,
            15,
            90,
            {
              ...BW,
              notes:
                'Normal ou declinada, a que der para fazer com boa técnica na faixa. Passou de 15, avance: normal → declinada → arqueira.',
            },
          ],
          ['Bench_Dips', 3, 8, 12, 90, { ...BW, notes: 'Na cadeira ou nas paralelas.' }],
          ['pike-push-up', 3, 6, 10, 90, { ...BW, notes: 'Preparação para o handstand.' }],
          ['Push-Ups_-_Close_Triceps_Position', 3, 8, 12, 90, BW],
          ['Plank', 3, 30, 60, 60, { ...BW, notes: 'Em segundos, não repetições.' }],
        ],
      },
      {
        name: 'Pernas · Academia',
        color: 'violet',
        focus: 'Quarta: pernas',
        exercises: [
          ['Barbell_Squat', 4, 6, 10, 120],
          [
            'Stiff-Legged_Barbell_Deadlift',
            3,
            8,
            10,
            120,
            { notes: 'Stiff ou levantamento terra.' },
          ],
          ['Split_Squat_with_Dumbbells', 3, 10, 10, 90, { notes: '10 repetições por perna.' }],
          ['Freehand_Jump_Squat', 3, 8, 8, 90, BW],
          ['Standing_Calf_Raises', 4, 12, 15, 60],
        ],
      },
      {
        name: 'Puxar · Academia',
        color: 'cyan',
        focus: 'Sexta: mesmos exercícios da segunda',
        exercises: CALISTHENICS_PULL,
      },
      {
        name: 'Empurrar + Abdômen · Casa',
        color: 'pink',
        focus: 'Sábado: empurrar, abdômen e circuito opcional',
        exercises: [
          [
            'Push-Ups_With_Feet_Elevated',
            4,
            8,
            15,
            90,
            {
              ...BW,
              notes:
                'Declinada ou arqueira, conforme o nível. Passou de 15 com boa técnica, avance para a arqueira.',
            },
          ],
          ['Bench_Dips', 3, 8, 12, 90, { ...BW, notes: 'Na cadeira ou nas paralelas.' }],
          ['pike-push-up', 3, 6, 10, 90, BW],
          ['Push-Ups_-_Close_Triceps_Position', 3, 8, 12, 90, BW],
          ['Flat_Bench_Lying_Leg_Raise', 3, 12, 15, 60, BW],
          ['Reverse_Crunch', 3, 15, 15, 60, BW],
          ['Crunches', 3, 15, 15, 60, BW],
          [
            'burpee',
            3,
            10,
            10,
            40,
            {
              ...BW,
              notes:
                'Circuito final opcional: 10 burpees + 30 polichinelos = 1 volta. 3 voltas, 40 s de descanso.',
            },
          ],
          [
            'jumping-jack',
            3,
            30,
            30,
            40,
            { ...BW, notes: 'Circuito final opcional, alternando com o burpee.' },
          ],
        ],
      },
    ],
  },
]

export function getTemplate(id: string): WorkoutTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id)
}
