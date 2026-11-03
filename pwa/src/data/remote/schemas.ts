import { z } from 'zod'
import { BODY_MEASURES, PLAN_COLORS } from '@/domain/types'

/* Respostas da API do aluno (docs/api-aluno.md), validadas na borda. */

const iso = z.string().min(1)

export const sessionResponseSchema = z.object({
  token: z.string().min(1),
  expiresAt: iso.nullable(),
  student: z.object({ id: z.string(), name: z.string(), phoneMasked: z.string().nullable() }),
  academy: z.object({ id: z.string(), name: z.string() }),
})
export type SessionResponse = z.infer<typeof sessionResponseSchema>

export const meResponseSchema = sessionResponseSchema.pick({ student: true, academy: true })

export const lookupNext = z.enum([
  'login',
  'first_access',
  'blocked',
  'suspended',
  'inactive',
  'not_found',
  'choose_academy',
])
export type LookupNext = z.infer<typeof lookupNext>

export const brandingSchema = z.object({
  slug: z.string(),
  name: z.string(),
  appName: z.string(),
  brandColor: z.string().nullable(),
  iconUrl: z.string().nullable(),
})
export type Branding = z.infer<typeof brandingSchema>

export const lookupResponseSchema = z.object({
  next: lookupNext,
  academies: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      next: z.enum(['login', 'first_access', 'blocked', 'suspended', 'inactive']),
    }),
  ),
})
export type LookupResponse = z.infer<typeof lookupResponseSchema>

const remoteExercise = z.object({
  id: z.string().min(1),
  exercise: z.object({
    source: z.enum(['catalog', 'custom', 'exercisedb']),
    id: z.string().min(1),
  }),
  exerciseName: z.string(),
  sets: z.number().int().min(0),
  repMin: z.number().int().min(0),
  repMax: z.number().int().min(0),
  loadKg: z.number().min(0),
  restSec: z.number().min(0),
  incrementKg: z.number().min(0),
  notes: z
    .string()
    .nullable()
    .transform((v) => v ?? ''),
})

export const remoteProgramSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  notes: z.string().nullable(),
  author: z.string().nullable(),
  startsOn: z.string().nullable(),
  expiresOn: z.string().nullable(),
  expired: z.boolean(),
  isNew: z.boolean(),
  updatedAt: iso,
  plans: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string(),
      // Cor desconhecida (versão nova do painel) não derruba a sincronização.
      color: z.enum(PLAN_COLORS).catch('lime'),
      position: z.number().int(),
      exercises: z.array(remoteExercise),
    }),
  ),
})
export type RemoteProgram = z.infer<typeof remoteProgramSchema>

export const programsResponseSchema = z.object({
  programs: z.array(remoteProgramSchema),
  syncedAt: iso,
})

export const noticesResponseSchema = z.object({
  notices: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      body: z.string(),
      pinned: z.boolean(),
      publishedAt: iso,
      expiresAt: iso.nullable(),
    }),
  ),
})

const measures = z
  .record(z.string(), z.number())
  .transform((m) =>
    Object.fromEntries(
      Object.entries(m).filter(([k]) => (BODY_MEASURES as readonly string[]).includes(k)),
    ),
  )

export const assessmentsResponseSchema = z.object({
  assessments: z.array(
    z.object({
      id: z.string(),
      assessedOn: z.string(),
      weightKg: z.number().nullable(),
      heightCm: z.number().nullable(),
      bodyFatPct: z.number().nullable(),
      // PHP manda [] para objeto vazio.
      measurementsCm: z.union([measures, z.array(z.unknown()).transform(() => ({}))]),
      notes: z.string().nullable(),
    }),
  ),
})

export const workoutsResponseSchema = z.object({
  accepted: z.array(z.string()),
  rejected: z.array(z.string()),
})

/** Corpo de POST /workouts: a sessão concluída no formato do app. */
export interface RemoteWorkout {
  id: string
  planId: string
  planName: string
  startedAt: string
  finishedAt: string
  exercises: {
    planExerciseId?: string
    exercise: { source: string; id: string }
    exerciseName: string
    sets: {
      weightKg: number | null
      reps: number | null
      isWarmup: boolean
      completedAt?: string
    }[]
  }[]
}
