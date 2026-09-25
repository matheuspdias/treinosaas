import { DEFAULT_SETTINGS } from '@/domain/types'
import type { Settings } from '@/domain/types'
import type { TreinoDB } from '../db/db'
import type { Repositories } from './types'

const SETTINGS_KEY = 'app'
const nowIso = () => new Date().toISOString()

export function createDexieRepositories(db: TreinoDB): Repositories {
  return {
    plans: {
      async list() {
        const all = await db.plans.orderBy('order').toArray()
        return all.filter((p) => !p.deletedAt)
      },
      async get(id) {
        const p = await db.plans.get(id)
        return p && !p.deletedAt ? p : undefined
      },
      async save(plan) {
        await db.plans.put(plan)
      },
      async saveMany(plans) {
        await db.plans.bulkPut(plans)
      },
      async remove(id) {
        const now = nowIso()
        await db.plans.update(id, { deletedAt: now, updatedAt: now })
      },
    },

    sessions: {
      get: (id) => db.sessions.get(id),
      async getActive() {
        const active = await db.sessions.where('status').equals('in_progress').toArray()
        return active.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
      },
      async listCompleted() {
        const done = await db.sessions.where('status').equals('completed').toArray()
        return done
          .filter((s) => !s.deletedAt)
          .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      },
      async save(session) {
        await db.sessions.put(session)
      },
      async remove(id) {
        await db.sessions.delete(id)
      },
    },

    customExercises: {
      async list() {
        const all = await db.customExercises.orderBy('name').toArray()
        return all.filter((e) => !e.deletedAt)
      },
      get: (id) => db.customExercises.get(id),
      async save(exercise) {
        await db.customExercises.put(exercise)
      },
      async remove(id) {
        const now = nowIso()
        await db.customExercises.update(id, { deletedAt: now, updatedAt: now })
      },
    },

    media: {
      get: (id) => db.mediaBlobs.get(id),
      async put(blob, mimeType) {
        const id = crypto.randomUUID()
        await db.mediaBlobs.put({ id, blob, mimeType, createdAt: nowIso() })
        return id
      },
      async remove(id) {
        await db.mediaBlobs.delete(id)
      },
    },

    settings: {
      async get() {
        const row = await db.settings.get(SETTINGS_KEY)
        return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<Settings> | undefined) ?? {}) }
      },
      async update(patch) {
        await db.transaction('rw', db.settings, async () => {
          const row = await db.settings.get(SETTINGS_KEY)
          const current = (row?.value as Partial<Settings> | undefined) ?? {}
          await db.settings.put({ key: SETTINGS_KEY, value: { ...current, ...patch } })
        })
      },
    },
  }
}
