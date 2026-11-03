import {
  accessState,
  parseAcademySlug,
  activeAcademyPrograms,
  formatPhoneInput,
  isAcademyPlan,
  isCompletePhone,
  nextSuggestedPlan,
  orderedActivePlans,
  phoneDigits,
  pinProblem,
} from './academy'
import type { AcademySession, Plan, Session } from './types'

const plan = (id: string, order: number, extra: Partial<Plan> = {}): Plan => ({
  id,
  name: id,
  color: 'lime',
  order,
  exercises: [],
  createdAt: 'x',
  updatedAt: 'x',
  ...extra,
})

const academy = (id: string, order: number, programId = 'prog', extra: Partial<Plan> = {}): Plan =>
  plan(id, order, {
    origin: 'academy',
    academy: {
      programId,
      programName: 'Hipertrofia',
      author: 'Prof',
      expiresOn: null,
      expired: false,
      isNew: false,
      programNotes: null,
    },
    ...extra,
  })

const done = (planId: string, startedAt: string): Session =>
  ({ id: startedAt, planId, startedAt, status: 'completed' }) as Session

describe('nextSuggestedPlan', () => {
  it('sem academia, segue a sequência de sempre (inclusive última ficha excluída)', () => {
    const plans = [plan('a', 0), plan('b', 1)]
    expect(nextSuggestedPlan(plans, [done('a', '2')])?.id).toBe('b')
    expect(nextSuggestedPlan(plans, [done('sumiu', '2'), done('a', '1')])?.id).toBe('a')
    expect(nextSuggestedPlan(plans, [])?.id).toBe('a')
  })

  it('com treino da academia ativo, segue as fichas da academia', () => {
    const plans = [plan('a', 0), academy('x', 0), academy('y', 1)]
    const history = [done('a', '3'), done('x', '2')]
    expect(nextSuggestedPlan(plans, history)?.id).toBe('y')
  })

  it('com fichas da academia todas arquivadas, volta às fichas do usuário', () => {
    const plans = [plan('a', 0), plan('b', 1), academy('x', 0, 'p', { archivedAt: 'z' })]
    expect(nextSuggestedPlan(plans, [done('x', '3'), done('a', '2')])?.id).toBe('b')
  })
})

describe('orderedActivePlans', () => {
  it('lista academia primeiro; sem academia, igual à ordem de sempre', () => {
    expect(orderedActivePlans([plan('b', 1), plan('a', 0)]).map((p) => p.id)).toEqual(['a', 'b'])
    expect(
      orderedActivePlans([plan('a', 0), academy('y', 1), academy('x', 0)]).map((p) => p.id),
    ).toEqual(['x', 'y', 'a'])
  })
})

describe('activeAcademyPrograms', () => {
  it('agrupa as fichas ativas por programa, em ordem', () => {
    const groups = activeAcademyPrograms([
      academy('b', 1),
      plan('own', 0),
      academy('a', 0),
      academy('old', 2, 'prog', { archivedAt: 'z' }),
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0]!.plans.map((p) => p.id)).toEqual(['a', 'b'])
    expect(isAcademyPlan(groups[0]!.plans[0]!)).toBe(true)
  })
})

describe('celular', () => {
  it('aplica a máscara enquanto digita', () => {
    expect(formatPhoneInput('1')).toBe('(1')
    expect(formatPhoneInput('1198')).toBe('(11) 98')
    expect(formatPhoneInput('11987654321')).toBe('(11) 98765-4321')
    expect(formatPhoneInput('+55 11 98765-4321')).toBe('(11) 98765-4321')
    expect(formatPhoneInput('119876543219999')).toBe('(11) 98765-4321')
  })

  it('reconhece celular completo', () => {
    expect(isCompletePhone('(11) 98765-4321')).toBe(true)
    expect(isCompletePhone('(11) 3876-5432')).toBe(false)
    expect(isCompletePhone('(11) 88765-4321')).toBe(false)
    expect(phoneDigits('5511987654321')).toBe('11987654321')
  })
})

describe('pinProblem', () => {
  it('recusa PIN fraco ou fora do formato', () => {
    expect(pinProblem('123')).not.toBeNull()
    expect(pinProblem('1111')).not.toBeNull()
    expect(pinProblem('1234')).not.toBeNull()
    expect(pinProblem('654321')).not.toBeNull()
    expect(pinProblem('12a4')).not.toBeNull()
    expect(pinProblem('2580')).toBeNull()
  })
})

describe('accessState', () => {
  const session: AcademySession = {
    token: 't',
    expiresAt: null,
    student: { id: 's', name: 'Ana', phoneMasked: null },
    academy: { id: 'a', name: 'Academia' },
    loggedInAt: '2026-11-01T00:00:00.000Z',
  }
  const day = 86_400_000
  const loggedIn = Date.parse(session.loggedInAt)

  it('sem sessão pede login (não existe uso sem academia)', () => {
    expect(accessState(null, { blocked: null, lastSyncAt: null })).toBe('login')
  })

  it('bloqueio do servidor vale mesmo offline', () => {
    const blocked = { code: 'academy_suspended', message: 'x' }
    expect(accessState(session, { blocked, lastSyncAt: null }, loggedIn)).toBe('blocked')
  })

  it('funciona offline por 7 dias desde a última confirmação', () => {
    const feed = { blocked: null, lastSyncAt: '2026-11-05T00:00:00.000Z' }
    expect(accessState(session, feed, loggedIn + 10 * day)).toBe('ok')
    expect(accessState(session, feed, loggedIn + 12 * day)).toBe('needs_connection')
    expect(accessState(session, { blocked: null, lastSyncAt: null }, loggedIn + 8 * day)).toBe(
      'needs_connection',
    )
  })
})

describe('parseAcademySlug', () => {
  it('pega o primeiro segmento do endereço', () => {
    expect(parseAcademySlug('/academia-demo/')).toBe('academia-demo')
    expect(parseAcademySlug('/academia-demo/fichas/123')).toBe('academia-demo')
    expect(parseAcademySlug('/forca2')).toBe('forca2')
  })

  it('fora de uma academia (raiz, arquivos do app, formato inválido) é null', () => {
    expect(parseAcademySlug('/')).toBeNull()
    expect(parseAcademySlug('/assets/index.js')).toBeNull()
    expect(parseAcademySlug('/exercises/x/0.webp')).toBeNull()
    expect(parseAcademySlug('/Academia')).toBeNull()
    expect(parseAcademySlug('/-x')).toBeNull()
  })
})
