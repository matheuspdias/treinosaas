import type { z } from 'zod'
import { API_URL } from './config'

export type ApiErrorKind = 'offline' | 'validation' | 'auth' | 'rate' | 'server' | 'invalid'

/** Erro da API com mensagem pronta para mostrar (pt-BR). */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  /** 401: 'unauthenticated' | 'inactive'. */
  readonly code: string | undefined
  /** 422: primeira mensagem de cada campo. */
  readonly fields: Record<string, string>

  constructor(
    kind: ApiErrorKind,
    message: string,
    code?: string,
    fields: Record<string, string> = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.code = code
    this.fields = fields
  }
}

interface RequestOptions<T> {
  method?: 'GET' | 'POST' | 'PUT'
  body?: unknown
  token?: string
  schema?: z.ZodType<T>
  signal?: AbortSignal
}

function readBody(text: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(text)
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function firstFieldErrors(errors: unknown): Record<string, string> {
  if (typeof errors !== 'object' || errors === null) return {}
  const out: Record<string, string> = {}
  for (const [field, list] of Object.entries(errors)) {
    if (Array.isArray(list) && typeof list[0] === 'string') out[field] = list[0]
  }
  return out
}

/** Chamada à API do aluno. Lança ApiError; sem `schema`, devolve undefined. */
export async function apiRequest<T = undefined>(
  path: string,
  { method = 'GET', body, token, schema, signal }: RequestOptions<T> = {},
): Promise<T> {
  if (!API_URL) throw new ApiError('server', 'O app não está configurado para academias.')
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new ApiError('offline', 'Sem internet. Tente de novo quando estiver conectado.')
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    throw new ApiError('offline', 'Não foi possível falar com a academia. Verifique a internet.')
  }

  const text = await response.text()
  const data = readBody(text)
  const message = typeof data.message === 'string' ? data.message : ''

  if (response.status === 401) {
    const code = typeof data.code === 'string' ? data.code : 'unauthenticated'
    throw new ApiError('auth', message || 'Sua sessão expirou. Entre de novo.', code)
  }
  if (response.status === 422) {
    const fields = firstFieldErrors(data.errors)
    throw new ApiError(
      'validation',
      Object.values(fields)[0] ?? (message || 'Confira os dados.'),
      undefined,
      fields,
    )
  }
  if (response.status === 429) {
    throw new ApiError('rate', 'Muitas tentativas. Espere um minuto e tente de novo.')
  }
  if (!response.ok) {
    throw new ApiError('server', 'A academia não respondeu agora. Tente de novo mais tarde.')
  }

  if (!schema) return undefined as T
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    throw new ApiError('invalid', 'Resposta inesperada do servidor. Atualize o app.')
  }
  return parsed.data
}
