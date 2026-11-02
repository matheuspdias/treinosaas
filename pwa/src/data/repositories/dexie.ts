import { DEFAULT_SETTINGS, EMPTY_ACADEMY_FEED } from '@/domain/types'
import type { AcademyFeed, AcademySession, Settings } from '@/domain/types'
import type { TreinoDB } from '../db/db'
import type { Repositories } from './types'

const SETTINGS_KEY = 'app'
const ACADEMY_SESSION_KEY = 'session'
const ACADEMY_FEED_KEY = 'feed'
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

    bodyMetrics: {
      async list() {
        const all = await db.bodyMetrics.orderBy('date').toArray()
        return all.filter((m) => !m.deletedAt)
      },
      async save(metric) {
        await db.bodyMetrics.put(metric)
      },
      async remove(id) {
        const now = nowIso()
        await db.bodyMetrics.update(id, { deletedAt: now, updatedAt: now })
      },
    },

    academy: {
      async getSession() {
        return (await db.academy.get(ACADEMY_SESSION_KEY))?.value as AcademySession | undefined
      },
      async saveSession(session) {
        await db.academy.put({ key: ACADEMY_SESSION_KEY, value: session })
      },
      async clearSession() {
        await db.academy.delete(ACADEMY_SESSION_KEY)
      },
      async getFeed() {
        const row = await db.academy.get(ACADEMY_FEED_KEY)
        return {
          ...EMPTY_ACADEMY_FEED,
          ...((row?.value as Partial<AcademyFeed> | undefined) ?? {}),
        }
      },
      async updateFeed(patch) {
        await db.transaction('rw', db.academy, async () => {
          const row = await db.academy.get(ACADEMY_FEED_KEY)
          const current = (row?.value as Partial<AcademyFeed> | undefined) ?? {}
          await db.academy.put({ key: ACADEMY_FEED_KEY, value: { ...current, ...patch } })
        })
      },
    },

    outbox: {
      list: () => db.syncOutbox.orderBy('createdAt').toArray(),
      async put(item) {
        await db.syncOutbox.put(item)
      },
      async remove(ids) {
        await db.syncOutbox.bulkDelete(ids)
      },
      count: () => db.syncOutbox.count(),
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
