// @vitest-environment node
import { plan, planExercise, session, sessionExercise, set } from '@/test/factories'
import { TreinoDB } from '../db/db'
import { createDexieRepositories } from '../repositories/dexie'
import { createBackup, parseBackup, restoreBackup } from './backup'

let counter = 0
function setup() {
  const db = new TreinoDB(`test-backup-${++counter}`)
  return { db, repos: createDexieRepositories(db) }
}

async function seed(repos: ReturnType<typeof setup>['repos']) {
  await repos.plans.save(plan('Treino A', 0, { exercises: [planExercise('bench')] }))
  await repos.sessions.save(
    session('2026-01-01T10:00:00Z', [sessionExercise('bench', [set(60, 10)])]),
  )
  const blobId = await repos.media.put(
    new Blob([new Uint8Array([1, 2, 3, 250])], { type: 'image/webp' }),
    'image/webp',
  )
  await repos.customExercises.save({
    id: 'c1',
    createdAt: 'x',
    updatedAt: 'x',
    name: 'Meu exercício',
    primaryMuscles: ['chest'],
    secondaryMuscles: [],
    equipment: 'machine',
    instructions: '',
    media: { kind: 'blob', blobId, mediaType: 'image', mimeType: 'image/webp' },
  })
  await repos.settings.update({ theme: 'dark' })
  await repos.bodyMetrics.save({
    id: 'bm1',
    createdAt: 'x',
    updatedAt: 'x',
    date: '2026-01-10',
    weightKg: 81.4,
    measurementsCm: { waist: 84 },
  })
  return blobId
}

describe('backup', () => {
  it('exporta e importa todos os dados sem perdas (ida e volta)', async () => {
    const source = setup()
    const blobId = await seed(source.repos)
    const file = await createBackup(source.db, new Date('2026-02-01T00:00:00Z'))
    const text = JSON.stringify(file)

    const parsed = parseBackup(text)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.summary).toEqual({
      plans: 1,
      sessions: 1,
      customExercises: 1,
      exportedAt: '2026-02-01T00:00:00.000Z',
    })

    const target = setup()
    await target.repos.plans.save(plan('Dado antigo', 0))
    await restoreBackup(target.db, parsed.backup)

    expect((await target.repos.plans.list()).map((p) => p.name)).toEqual(['Treino A'])
    expect(await target.repos.sessions.listCompleted()).toHaveLength(1)
    expect((await target.repos.settings.get()).theme).toBe('dark')
    expect(await target.repos.bodyMetrics.list()).toMatchObject([
      { weightKg: 81.4, measurementsCm: { waist: 84 } },
    ])
    const blob = await target.repos.media.get(blobId)
    expect(Array.from(new Uint8Array(await blob!.blob.arrayBuffer()))).toEqual([1, 2, 3, 250])
  })

  it('rejeita JSON inválido', () => {
    expect(parseBackup('{oops')).toEqual({ ok: false, error: 'O arquivo não é um JSON válido.' })
  })

  it('rejeita arquivo de outro app', () => {
    const r = parseBackup(JSON.stringify({ foo: 1 }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/não é um backup/)
  })

  it('rejeita backup de versão mais nova', () => {
    const r = parseBackup(JSON.stringify({ app: 'treinoapp', formatVersion: 99 }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/versão mais nova/)
  })

  it('rejeita dados corrompidos e indica o campo', async () => {
    const { db, repos } = setup()
    await seed(repos)
    const file = await createBackup(db)
    const broken = JSON.parse(JSON.stringify(file)) as { data: { plans: { color: string }[] } }
    broken.data.plans[0]!.color = 'roxo-neon'
    const r = parseBackup(JSON.stringify(broken))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('data.plans.0.color')
  })

  it('import inválido não altera os dados existentes', async () => {
    const { db, repos } = setup()
    await repos.plans.save(plan('Mantém', 0))
    const r = parseBackup('[]')
    expect(r.ok).toBe(false)
    expect((await createDexieRepositories(db).plans.list()).map((p) => p.name)).toEqual(['Mantém'])
  })

  it('importa backup do formato antigo (v1), sem peso e medidas', async () => {
    const { db, repos } = setup()
    await seed(repos)
    const current = await createBackup(db)
    const { bodyMetrics: _drop, ...dataV1 } = current.data
    const v1 = { ...current, formatVersion: 1, data: dataV1 }
    const r = parseBackup(JSON.stringify(v1))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.backup.formatVersion).toBe(2)
    expect(r.backup.data.bodyMetrics).toEqual([])
    const target = setup()
    await restoreBackup(target.db, r.backup)
    expect(await target.repos.plans.list()).toHaveLength(1)
  })
})
