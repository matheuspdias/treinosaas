// @vitest-environment node
import { z } from 'zod'
import { ApiError, apiRequest } from './client'

vi.mock('./config', () => ({ API_URL: 'http://api.test/api' }))

function reply(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  )
}

async function errorOf(promise: Promise<unknown>) {
  try {
    await promise
  } catch (e) {
    if (e instanceof ApiError) return e
    throw e
  }
  throw new Error('esperava erro')
}

afterEach(() => vi.unstubAllGlobals())

describe('apiRequest', () => {
  it('envia token e corpo, e valida a resposta', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const data = await apiRequest('/student/me', {
      method: 'POST',
      token: 'abc',
      body: { a: 1 },
      schema: z.object({ ok: z.boolean() }),
    })
    expect(data).toEqual({ ok: true })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('http://api.test/api/student/me')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer abc')
    expect(init.body).toBe('{"a":1}')
  })

  it('traduz 422 com a mensagem de cada campo', async () => {
    reply(422, { message: 'x', errors: { pin: ['PIN incorreto.'], phone: ['Não achei.'] } })
    const error = await errorOf(apiRequest('/x'))
    expect(error.kind).toBe('validation')
    expect(error.message).toBe('PIN incorreto.')
    expect(error.fields).toEqual({ pin: 'PIN incorreto.', phone: 'Não achei.' })
  })

  it('identifica sessão encerrada pela academia', async () => {
    reply(401, { code: 'inactive', message: 'Acesso encerrado.' })
    const error = await errorOf(apiRequest('/x'))
    expect(error).toMatchObject({ kind: 'auth', code: 'inactive', message: 'Acesso encerrado.' })
  })

  it('identifica academia suspensa (403 com código)', async () => {
    reply(403, { code: 'academy_suspended', message: 'Fale com a academia.' })
    const error = await errorOf(apiRequest('/x'))
    expect(error).toMatchObject({
      kind: 'blocked',
      code: 'academy_suspended',
      message: 'Fale com a academia.',
    })
  })

  it('trata limite de tentativas, erro do servidor e resposta inesperada', async () => {
    reply(429, {})
    expect((await errorOf(apiRequest('/x'))).kind).toBe('rate')
    reply(500, {})
    expect((await errorOf(apiRequest('/x'))).kind).toBe('server')
    reply(200, { nada: 1 })
    expect((await errorOf(apiRequest('/x', { schema: z.object({ ok: z.boolean() }) }))).kind).toBe(
      'invalid',
    )
  })

  it('falha de rede vira "offline"', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )
    expect((await errorOf(apiRequest('/x'))).kind).toBe('offline')
  })
})
