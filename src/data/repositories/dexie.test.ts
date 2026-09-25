// @vitest-environment node
import { plan, session, sessionExercise, set } from '@/test/factories'
import { TreinoDB } from '../db/db'
import { createDexieRepositories } from './dexie'

let counter = 0
function setup() {
  const db = new TreinoDB(`test-repos-${++counter}`)
  return { db, repos: createDexieRepositories(db) }
}

describe('repositórios Dexie', () => {
  it('lista fichas por ordem e oculta as excluídas', async () => {
    const { repos } = setup()
    const b = plan('B', 1)
    const a = plan('A', 0)
    const c = plan('C', 2)
    await repos.plans.saveMany([b, a, c])
    await repos.plans.remove(c.id)
    expect((await repos.plans.list()).map((p) => p.name)).toEqual(['A', 'B'])
    expect(await repos.plans.get(c.id)).toBeUndefined()
  })

  it('separa sessão ativa das concluídas', async () => {
    const { repos } = setup()
    const done1 = session('2026-01-01T10:00:00Z', [sessionExercise('x', [set(10, 10)])])
    const done2 = session('2026-01-05T10:00:00Z', [])
    const active = session('2026-01-10T10:00:00Z', [], { status: 'in_progress' })
    await Promise.all([done1, done2, active].map((s) => repos.sessions.save(s)))
    expect((await repos.sessions.getActive())?.id).toBe(active.id)
    expect((await repos.sessions.listCompleted()).map((s) => s.id)).toEqual([done2.id, done1.id])
  })

  it('mescla preferências com os padrões', async () => {
    const { repos } = setup()
    expect((await repos.settings.get()).weightUnit).toBe('kg')
    await repos.settings.update({ theme: 'dark' })
    await repos.settings.update({ restSound: false })
    const s = await repos.settings.get()
    expect(s).toMatchObject({ theme: 'dark', restSound: false, defaultIncrementKg: 2.5 })
  })
})
