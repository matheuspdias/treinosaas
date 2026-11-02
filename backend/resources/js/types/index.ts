import type { PlanColor } from '@/ui/theme/planColors'

export type Role = 'owner' | 'admin' | 'instructor'

export type Ability =
  | 'academy.manage'
  | 'dashboard.view'
  | 'students.view'
  | 'students.manage'
  | 'programs.manage'
  | 'training.view'
  | 'assessments.manage'
  | 'notices.manage'

export interface CurrentAcademy {
  id: string
  name: string
  role: Role | null
  roleLabel: string | null
  abilities: Ability[]
}

export interface AuthUser {
  id: number
  name: string
  email: string
  email_verified_at: string | null
}

export interface SharedData {
  name: string
  auth: { user: AuthUser | null }
  academy: CurrentAcademy | null
  flash: { success: string | null; error: string | null }
  errors: Record<string, string>
  [key: string]: unknown
}

export type StudentStatus = 'active' | 'inactive'
export type AccessState = 'active' | 'pending' | 'expired' | 'locked'

export interface StudentSummary {
  id: string
  name: string
  phoneMasked: string | null
  phone?: string | null
  status: StudentStatus
  access: AccessState
  pinSetAt: string | null
  firstAccessUntil: string | null
  lastWorkoutAt: string | null
  createdAt: string
  program: { id: string; name: string; expiresOn: string | null; expired: boolean } | null
}

export interface Paginated<T> {
  data: T[]
  links: { prev: string | null; next: string | null }
  meta: { current_page: number; last_page: number; total: number }
}

export interface ProgramExerciseData {
  id: string | null
  exerciseId: string
  exerciseName: string
  sets: number
  repMin: number
  repMax: number
  loadKg: number
  restSec: number
  incrementKg: number
  notes: string | null
}

export interface ProgramPlanData {
  id: string | null
  name: string
  color: PlanColor
  exercises: ProgramExerciseData[]
}

export interface ProgramData {
  id: string | null
  name: string
  notes: string | null
  startsOn: string | null
  expiresOn: string | null
  isTemplate: boolean
  archived?: boolean
  student: { id: string; name: string } | null
  plans: ProgramPlanData[]
}

export interface Notice {
  id: string
  title: string
  body: string
  pinned: boolean
  publishedAt: string
  expiresAt: string | null
}
