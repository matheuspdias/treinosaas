export type ID = string
/** Data/hora em ISO 8601 (UTC). */
export type ISODate = string

/** Metadados comuns a toda entidade do usuário (preparados para sincronização futura). */
export interface Entity {
  id: ID
  createdAt: ISODate
  updatedAt: ISODate
  deletedAt?: ISODate
}

// ---------------------------------------------------------------------------
// Exercícios
// ---------------------------------------------------------------------------

export type ExerciseSource = 'catalog' | 'custom' | 'exercisedb'

export interface ExerciseRef {
  source: ExerciseSource
  id: string
}

export const MUSCLES = [
  'chest',
  'lats',
  'middle back',
  'lower back',
  'traps',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'abdominals',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
  'adductors',
  'abductors',
  'neck',
] as const
export type Muscle = (typeof MUSCLES)[number]

export const EQUIPMENT = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'body only',
  'kettlebells',
  'bands',
  'e-z curl bar',
  'medicine ball',
  'exercise ball',
  'foam roll',
  'other',
] as const
export type Equipment = (typeof EQUIPMENT)[number]

/** Visão unificada de um exercício, venha de onde vier (catálogo, personalizado, API). */
export interface Exercise {
  ref: ExerciseRef
  name: string
  /** Nome original em inglês (catálogo), útil para busca. */
  nameEn?: string
  primaryMuscles: Muscle[]
  secondaryMuscles: Muscle[]
  equipment: Equipment | null
  category?: string
  instructions: string[]
}

export type CustomMedia =
  | { kind: 'blob'; blobId: ID; mediaType: 'image' | 'gif' | 'video'; mimeType: string }
  | { kind: 'youtube'; videoId: string }

export interface CustomExercise extends Entity {
  name: string
  primaryMuscles: Muscle[]
  secondaryMuscles: Muscle[]
  equipment: Equipment | null
  instructions: string
  media?: CustomMedia
}

export interface MediaBlob {
  id: ID
  blob: Blob
  mimeType: string
  createdAt: ISODate
}

// ---------------------------------------------------------------------------
// Fichas
// ---------------------------------------------------------------------------

export const PLAN_COLORS = [
  'lime',
  'emerald',
  'cyan',
  'blue',
  'violet',
  'pink',
  'red',
  'orange',
  'amber',
] as const
export type PlanColor = (typeof PLAN_COLORS)[number]

/** Parâmetros-alvo de um exercício dentro de uma ficha. */
export interface ExerciseTarget {
  sets: number
  repMin: number
  repMax: number
  loadKg: number
  restSec: number
  incrementKg: number
}

export interface PlanExercise extends ExerciseTarget {
  id: ID
  exercise: ExerciseRef
  notes: string
}

export interface Plan extends Entity {
  name: string
  color: PlanColor
  /** Posição na sequência (A → B → C). */
  order: number
  archivedAt?: ISODate
  exercises: PlanExercise[]
}

// ---------------------------------------------------------------------------
// Sessões (treinos realizados)
// ---------------------------------------------------------------------------

export interface SetLog {
  id: ID
  weightKg: number | null
  reps: number | null
  isWarmup: boolean
  /** Presente quando a série foi concluída. */
  completedAt?: ISODate
}

/** Sugestão de dupla progressão calculada ao iniciar o treino. */
export interface ProgressionSuggestion {
  fromKg: number
  toKg: number
  status: 'pending' | 'accepted' | 'dismissed'
}

export interface SessionExercise {
  id: ID
  planExerciseId?: ID
  exercise: ExerciseRef
  /** Nome no momento do treino (o histórico não muda se o exercício for renomeado). */
  exerciseName: string
  target: ExerciseTarget
  notes: string
  sets: SetLog[]
  progression?: ProgressionSuggestion
}

export type SessionStatus = 'in_progress' | 'completed'

export interface RestTimer {
  /** Instante absoluto de término: sobrevive a reload e segundo plano. */
  endsAt: ISODate
  durationSec: number
}

export interface Session extends Entity {
  planId: ID
  planName: string
  planColor: PlanColor
  status: SessionStatus
  startedAt: ISODate
  finishedAt?: ISODate
  currentExerciseIndex: number
  rest: RestTimer | null
  exercises: SessionExercise[]
}

// ---------------------------------------------------------------------------
// Corpo
// ---------------------------------------------------------------------------

export const BODY_MEASURES = ['waist', 'chest', 'hips', 'arm', 'thigh', 'calf'] as const
export type BodyMeasure = (typeof BODY_MEASURES)[number]

/** Registro de peso e medidas num dia. Medidas em cm. */
export interface BodyMetric extends Entity {
  /** Dia local, AAAA-MM-DD. */
  date: string
  weightKg?: number
  bodyFatPct?: number
  measurementsCm: Partial<Record<BodyMeasure, number>>
}

// ---------------------------------------------------------------------------
// Preferências
// ---------------------------------------------------------------------------

export type ThemePreference = 'system' | 'light' | 'dark'
export type WeightUnit = 'kg' | 'lb'

export interface Settings {
  theme: ThemePreference
  weightUnit: WeightUnit
  restSound: boolean
  restVibration: boolean
  restNotification: boolean
  defaultRestSec: number
  defaultIncrementKg: number
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  weightUnit: 'kg',
  restSound: true,
  restVibration: true,
  restNotification: true,
  defaultRestSec: 90,
  defaultIncrementKg: 2.5,
}
