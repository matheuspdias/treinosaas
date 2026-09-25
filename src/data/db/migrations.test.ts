// @vitest-environment node
import Dexie from 'dexie'
import { TreinoDB } from './db'
import { DB_VERSION } from './migrations'

let counter = 0
const uniqueName = () => `test-migrations-${++counter}`

describe('migrations', () => {
  it('cria o banco na versão atual com todas as tabelas', async () => {
    const db = new TreinoDB(uniqueName())
    await db.open()
    expect(db.verno).toBe(DB_VERSION)
    expect(db.tables.map((t) => t.name).sort()).toEqual([
      'customExercises',
      'mediaBlobs',
      'plans',
      'sessions',
      'settings',
    ])
    expect(db.sessions.schema.indexes.map((i) => i.name).sort()).toEqual([
      'planId',
      'startedAt',
      'status',
    ])
    db.close()
  })

  it('preserva os dados ao reabrir um banco criado na v1', async () => {
    const name = uniqueName()
    // Simula um usuário com a v1 instalada (schema escrito à mão, independente do código atual).
    const v1 = new Dexie(name)
    v1.version(1).stores({
      plans: 'id, order',
      customExercises: 'id, name',
      mediaBlobs: 'id',
      sessions: 'id, planId, status, startedAt',
      settings: 'key',
    })
    await v1.open()
    await v1.table('plans').put({ id: 'p1', name: 'Treino A', order: 0, exercises: [] })
    await v1.table('settings').put({ key: 'app', value: { weightUnit: 'kg' } })
    v1.close()

    const db = new TreinoDB(name)
    await db.open()
    expect(await db.plans.get('p1')).toMatchObject({ name: 'Treino A' })
    expect(await db.settings.get('app')).toMatchObject({ value: { weightUnit: 'kg' } })
    db.close()
  })
})
