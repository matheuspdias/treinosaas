// @vitest-environment node
import { repos } from '@/data'
import type { AcademySession, Plan } from '@/domain/types'
import { resetDatabase } from '@/test/resetDb'
import { plan, planExercise, session, sessionExercise, set } from '@/test/factories'
import {
  endAcademySession,
  enqueueWorkout,
  markProgramSeen,
  pullAll,
  pushOutbox,
  syncNow,
} from './academySync'

vi.mock('../remote/config', () => ({ API_URL: 'http://api.test/api' }))

const AUTH: AcademySession = {
  token: 'tok',
  expiresAt: null,
  student: { id: 'stu-1', name: 'Ana Souza', phoneMasked: '(11) 9••••-4321' },
  academy: { id: 'acad-1', name: 'Academia Demo' },
  loggedInAt: '2026-11-01T00:00:00.000Z',
}

function academyPlan(id: string, programId = 'prog-1', extra: Partial<Plan> = {}): Plan {
  return plan(id, 0, {
    id,
    origin: 'academy',
    academy: {
      programId,
      programName: 'Hipertrofia',
      author: null,
      expiresOn: null,
      expired: false,
      isNew: true,
      programNotes: null,
    },
    exercises: [planExercise('Barbell_Squat')],
    ...extra,
  })
}

type Handler = (url: string, init: RequestInit) => { status: number; body: unknown }

function mockApi(handler: Handler) {
  const fn = vi.fn(async (url: string, init: RequestInit = {}) => {
    const { status, body } = handler(url, init)
    return new Response(JSON.stringify(body), { status })
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

const emptyFeed: Handler = (url) => {
  if (url.endsWith('/programs')) return { status: 200, body: { programs: [], syncedAt: 'x' } }
  if (url.endsWith('/notices')) return { status: 200, body: { notices: [] } }
  if (url.endsWith('/assessments')) return { status: 200, body: { assessments: [] } }
  return { status: 404, body: {} }
}

beforeEach(async () => {
  await resetDatabase()
  mockApi(emptyFeed)
})
afterEach(async () => {
  // Espera a sincronização em segundo plano (disparada por enqueue/markSeen) terminar.
  await syncNow()
  vi.unstubAllGlobals()
})

describe('fila de envio', () => {
  it('só enfileira treinos concluídos de fichas da academia, com aluno logado', async () => {
    const own = plan('Minha', 0)
    await repos.plans.saveMany([own, academyPlan('ap')])
    const done = (planId: string) =>
      session('2026-11-02T10:00:00.000Z', [sessionExercise('x', [set(50, 10)])], { planId })

    expect(await enqueueWorkout(done('ap'))).toBe(false) // sem login
    await repos.academy.saveSession(AUTH)
    expect(await enqueueWorkout(done(own.id))).toBe(false)
    expect(await enqueueWorkout(done('ap'))).toBe(true)
    const items = await repos.outbox.list()
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ kind: 'workout', studentId: 'stu-1' })
  })

  it('remove o que a academia aceitou ou recusou e mantém o resto', async () => {
    const now = '2026-11-02T10:00:00.000Z'
    const base = { kind: 'workout' as const, createdAt: now, attempts: 0, nextAttemptAt: now }
    const payload = (id: string) => ({
      id,
      planId: 'ap',
      planName: 'A',
      startedAt: now,
      finishedAt: now,
      exercises: [],
    })
    await repos.outbox.put({ ...base, id: 'w1', studentId: 'stu-1', payload: payload('w1') })
    await repos.outbox.put({ ...base, id: 'w2', studentId: 'stu-1', payload: payload('w2') })
    await repos.outbox.put({ ...base, id: 'w3', studentId: 'stu-1', payload: payload('w3') })
    await repos.outbox.put({
      ...base,
      id: 'old',
      studentId: 'outro-aluno',
      payload: payload('old'),
    })
    const api = mockApi(() => ({ status: 200, body: { accepted: ['w1'], rejected: ['w2'] } }))

    await pushOutbox(AUTH, Date.parse(now))

    expect((await repos.outbox.list()).map((i) => i.id)).toEqual(['w3'])
    const sent = JSON.parse((api.mock.calls[0]![1] as RequestInit).body as string) as {
      sessions: { id: string }[]
    }
    expect(sent.sessions.map((s) => s.id)).toEqual(['w1', 'w2', 'w3'])
  })

  it('espera mais a cada falha e não tenta antes da hora', async () => {
    const now = Date.parse('2026-11-02T10:00:00.000Z')
    const iso = new Date(now).toISOString()
    await repos.outbox.put({
      id: 'w1',
      kind: 'workout',
      studentId: 'stu-1',
      createdAt: iso,
      attempts: 0,
      nextAttemptAt: iso,
      payload: {
        id: 'w1',
        planId: 'p',
        planName: 'A',
        startedAt: iso,
        finishedAt: iso,
        exercises: [],
      },
    })
    const api = mockApi(() => ({ status: 500, body: {} }))
    await pushOutbox(AUTH, now)
    const [item] = await repos.outbox.list()
    expect(item!.attempts).toBe(1)
    expect(Date.parse(item!.nextAttemptAt)).toBe(now + 30_000)

    await pushOutbox(AUTH, now + 1000)
    expect(api).toHaveBeenCalledTimes(1)
  })
})

describe('busca dos treinos', () => {
  it('cria as fichas da academia, arquiva as que sumiram e guarda mural e avaliações', async () => {
    await repos.plans.saveMany([plan('Minha', 0), academyPlan('sumiu', 'prog-velho')])
    mockApi((url) => {
      if (url.endsWith('/programs'))
        return {
          status: 200,
          body: {
            syncedAt: 'x',
            programs: [
              {
                id: 'prog-1',
                name: 'Hipertrofia',
                notes: null,
                author: 'Prof',
                startsOn: null,
                expiresOn: null,
                expired: false,
                isNew: true,
                updatedAt: '2026-11-01T00:00:00.000Z',
                plans: [{ id: 'pa', name: 'Treino A', color: 'lime', position: 0, exercises: [] }],
              },
            ],
          },
        }
      if (url.endsWith('/notices'))
        return {
          status: 200,
          body: {
            notices: [
              {
                id: 'n',
                title: 'Feriado',
                body: 'Fechado',
                pinned: true,
                publishedAt: 'x',
                expiresAt: null,
              },
            ],
          },
        }
      return emptyFeed(url, {})
    })

    await pullAll(AUTH)

    const plans = await repos.plans.list()
    expect(plans.find((p) => p.id === 'pa')).toMatchObject({ origin: 'academy', name: 'Treino A' })
    expect(plans.find((p) => p.id === 'sumiu')!.archivedAt).toBeDefined()
    expect(plans.find((p) => p.name === 'Minha')!.archivedAt).toBeUndefined()
    expect((await repos.academy.getFeed()).notices).toHaveLength(1)
  })

  it('"visto" some o aviso na hora e vai na fila', async () => {
    await repos.academy.saveSession(AUTH)
    await repos.plans.saveMany([academyPlan('a1'), academyPlan('a2')])
    mockApi(() => ({ status: 503, body: {} }))
    await markProgramSeen('prog-1')
    const plans = await repos.plans.list()
    expect(plans.every((p) => p.academy?.isNew === false)).toBe(true)
    expect((await repos.outbox.list()).map((i) => i.id)).toContain('seen:prog-1')
  })
})

describe('fim da sessão', () => {
  it('acesso encerrado pela academia: sai, arquiva as fichas da academia e mantém o resto', async () => {
    await repos.academy.saveSession(AUTH)
    const own = plan('Minha', 0)
    await repos.plans.saveMany([own, academyPlan('ap')])
    await repos.sessions.save(session('2026-11-01T10:00:00.000Z', [], { planId: 'ap' }))
    mockApi(() => ({ status: 401, body: { code: 'inactive', message: 'Encerrado.' } }))

    await syncNow()

    expect(await repos.academy.getSession()).toBeUndefined()
    const plans = await repos.plans.list()
    expect(plans.find((p) => p.id === 'ap')!.archivedAt).toBeDefined()
    expect(plans.find((p) => p.id === own.id)!.archivedAt).toBeUndefined()
    expect(await repos.sessions.listCompleted()).toHaveLength(1)
    expect((await repos.academy.getFeed()).lastError).toMatch(/encerrado/)
  })

  it('academia suspensa: bloqueia sem sair, mantém a fila e libera na reativação', async () => {
    await repos.academy.saveSession(AUTH)
    await repos.plans.saveMany([academyPlan('ap')])
    await repos.sessions.save(
      session('2026-11-01T10:00:00.000Z', [sessionExercise('Barbell_Squat', [set(10, 50)])], {
        planId: 'ap',
      }),
    )
    mockApi(() => ({
      status: 403,
      body: { code: 'academy_suspended', message: 'Acesso suspenso. Fale com a academia.' },
    }))
    await enqueueWorkout((await repos.sessions.listCompleted())[0]!)
    await syncNow()

    expect(await repos.academy.getSession()).toEqual(AUTH)
    expect((await repos.academy.getFeed()).blocked).toEqual({
      code: 'academy_suspended',
      message: 'Acesso suspenso. Fale com a academia.',
    })
    expect(await repos.outbox.count()).toBe(1)
    expect((await repos.plans.get('ap'))!.archivedAt).toBeUndefined()

    mockApi((url, init) =>
      url.endsWith('/workouts')
        ? {
            status: 200,
            body: { accepted: [JSON.parse(init.body as string).sessions[0].id], rejected: [] },
          }
        : emptyFeed(url, init),
    )
    await syncNow()
    expect((await repos.academy.getFeed()).blocked).toBeNull()
    expect(await repos.outbox.count()).toBe(0)
  })

  it('token expirado mantém a fila para depois do novo login', async () => {
    await repos.academy.saveSession(AUTH)
    const iso = '2026-11-01T10:00:00.000Z'
    await repos.outbox.put({
      id: 'w1',
      kind: 'workout',
      studentId: 'stu-1',
      createdAt: iso,
      attempts: 0,
      nextAttemptAt: iso,
      payload: {
        id: 'w1',
        planId: 'p',
        planName: 'A',
        startedAt: iso,
        finishedAt: iso,
        exercises: [],
      },
    })
    await endAcademySession('unauthenticated')
    expect(await repos.outbox.count()).toBe(1)
    await repos.academy.saveSession(AUTH)
    await endAcademySession('logout')
    expect(await repos.outbox.count()).toBe(0)
  })
})
