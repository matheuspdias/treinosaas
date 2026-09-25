import { z } from 'zod'
import { EQUIPMENT, MUSCLES, PLAN_COLORS } from '@/domain/types'

export const BACKUP_FORMAT_VERSION = 1
export const BACKUP_APP_ID = 'treinoapp'

const iso = z.string().min(1)
const entity = {
  id: z.string().min(1),
  createdAt: iso,
  updatedAt: iso,
  deletedAt: iso.optional(),
}

const exerciseRef = z.object({
  source: z.enum(['catalog', 'custom', 'exercisedb']),
  id: z.string().min(1),
})

const target = {
  sets: z.number().int().min(0),
  repMin: z.number().int().min(0),
  repMax: z.number().int().min(0),
  loadKg: z.number().min(0),
  restSec: z.number().min(0),
  incrementKg: z.number().min(0),
}

export const planSchema = z.object({
  ...entity,
  name: z.string(),
  color: z.enum(PLAN_COLORS),
  order: z.number(),
  archivedAt: iso.optional(),
  exercises: z.array(
    z.object({ id: z.string().min(1), exercise: exerciseRef, notes: z.string(), ...target }),
  ),
})

const setLog = z.object({
  id: z.string().min(1),
  weightKg: z.number().min(0).nullable(),
  reps: z.number().int().min(0).nullable(),
  isWarmup: z.boolean(),
  completedAt: iso.optional(),
})

export const sessionSchema = z.object({
  ...entity,
  planId: z.string(),
  planName: z.string(),
  planColor: z.enum(PLAN_COLORS),
  status: z.enum(['in_progress', 'completed']),
  startedAt: iso,
  finishedAt: iso.optional(),
  currentExerciseIndex: z.number().int().min(0),
  rest: z.object({ endsAt: iso, durationSec: z.number() }).nullable(),
  exercises: z.array(
    z.object({
      id: z.string().min(1),
      planExerciseId: z.string().optional(),
      exercise: exerciseRef,
      exerciseName: z.string(),
      target: z.object(target),
      notes: z.string(),
      sets: z.array(setLog),
    }),
  ),
})

const customMedia = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('blob'),
    blobId: z.string().min(1),
    mediaType: z.enum(['image', 'gif', 'video']),
    mimeType: z.string(),
  }),
  z.object({ kind: z.literal('youtube'), videoId: z.string().min(1) }),
])

export const customExerciseSchema = z.object({
  ...entity,
  name: z.string().min(1),
  primaryMuscles: z.array(z.enum(MUSCLES)),
  secondaryMuscles: z.array(z.enum(MUSCLES)),
  equipment: z.enum(EQUIPMENT).nullable(),
  instructions: z.string(),
  media: customMedia.optional(),
})

export const settingsSchema = z
  .object({
    theme: z.enum(['system', 'light', 'dark']),
    weightUnit: z.enum(['kg', 'lb']),
    restSound: z.boolean(),
    restVibration: z.boolean(),
    restNotification: z.boolean(),
    defaultRestSec: z.number().min(0),
    defaultIncrementKg: z.number().min(0),
  })
  .partial()

export const mediaBlobSchema = z.object({
  id: z.string().min(1),
  mimeType: z.string(),
  createdAt: iso,
  dataBase64: z.string(),
})

export const backupSchema = z.object({
  app: z.literal(BACKUP_APP_ID),
  formatVersion: z.literal(BACKUP_FORMAT_VERSION),
  exportedAt: iso,
  data: z.object({
    plans: z.array(planSchema),
    sessions: z.array(sessionSchema),
    customExercises: z.array(customExerciseSchema),
    mediaBlobs: z.array(mediaBlobSchema),
    settings: settingsSchema,
  }),
})

export type BackupFile = z.infer<typeof backupSchema>
