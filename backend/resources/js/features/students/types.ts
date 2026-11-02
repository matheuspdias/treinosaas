export interface StudentProgram {
  id: string
  name: string
  plansCount: number
  startsOn: string | null
  expiresOn: string | null
  expired: boolean
  archived: boolean
  seen: boolean
  createdAt: string
}

export interface StudentSession {
  id: string
  planName: string
  finishedAt: string
  durationSec: number
  volumeKg: number
  setsCount: number
}

export interface LoadSeries {
  key: string
  name: string
  points: { day: string; weightKg: number | null; reps: number | null; sets: number }[]
}

export interface StudentAssessment {
  id: string
  assessedOn: string
  weightKg: number | null
  heightCm: number | null
  bodyFatPct: number | null
  measurementsCm: Partial<Record<Measure, number>>
  notes: string | null
  author: string | null
}

export const MEASURES = ['waist', 'chest', 'hips', 'arm', 'thigh', 'calf'] as const
export type Measure = (typeof MEASURES)[number]

export const MEASURE_LABEL: Record<Measure, string> = {
  waist: 'Cintura',
  chest: 'Peito',
  hips: 'Quadril',
  arm: 'Braço',
  thigh: 'Coxa',
  calf: 'Panturrilha',
}

export interface StudentProfile {
  programs: StudentProgram[]
  sessions: StudentSession[]
  trainingDays: string[]
  loads: LoadSeries[]
  assessments: StudentAssessment[]
}
