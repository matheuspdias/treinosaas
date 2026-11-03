import { phoneDigits } from '@/domain/academy'
import type { AcademySession } from '@/domain/types'
import { repos } from '../index'
import { apiRequest } from '../remote/client'
import { ACADEMY_SLUG } from '../remote/config'
import { lookupResponseSchema, sessionResponseSchema } from '../remote/schemas'
import type { LookupResponse, SessionResponse } from '../remote/schemas'
import { endAcademySession, syncNow } from './academySync'

/* Login do aluno na academia: telefone → PIN (ou criação do PIN no primeiro acesso). */

function deviceName(): string {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent
  if (/iPhone|iPad/i.test(ua)) return 'iPhone'
  if (/Android/i.test(ua)) return 'Android'
  return 'Navegador'
}

export function lookupPhone(phone: string): Promise<LookupResponse> {
  return apiRequest('/student/auth/lookup', {
    method: 'POST',
    // O app de cada academia só procura o aluno nela.
    body: { phone: phoneDigits(phone), academy: ACADEMY_SLUG },
    schema: lookupResponseSchema,
  })
}

export interface Credentials {
  phone: string
  pin: string
  academyId?: string | undefined
}

async function start(response: SessionResponse): Promise<AcademySession> {
  const session: AcademySession = {
    token: response.token,
    expiresAt: response.expiresAt,
    student: response.student,
    academy: response.academy,
    loggedInAt: new Date().toISOString(),
  }
  // Antes da sessão: assim que ela existe o app sai da tela de entrada, e o aluno da academia
  // não passa pelas boas-vindas (os treinos chegam da academia).
  await repos.settings.update({ onboardingDone: true })
  await repos.academy.saveSession(session)
  await repos.academy.updateFeed({ lastError: null })
  void syncNow()
  return session
}

const body = ({ phone, pin, academyId }: Credentials) => ({
  phone: phoneDigits(phone),
  pin,
  device: deviceName(),
  academy: ACADEMY_SLUG,
  ...(academyId ? { academyId } : {}),
})

export async function loginWithPin(credentials: Credentials): Promise<AcademySession> {
  return start(
    await apiRequest('/student/auth/login', {
      method: 'POST',
      body: body(credentials),
      schema: sessionResponseSchema,
    }),
  )
}

export async function createPinAndLogin(credentials: Credentials): Promise<AcademySession> {
  return start(
    await apiRequest('/student/auth/first-access', {
      method: 'POST',
      body: { ...body(credentials), acceptPrivacy: true },
      schema: sessionResponseSchema,
    }),
  )
}

export async function changePin(currentPin: string, pin: string): Promise<void> {
  const auth = await repos.academy.getSession()
  if (!auth) return
  await apiRequest('/student/pin', { method: 'PUT', token: auth.token, body: { currentPin, pin } })
}

/** Sai da academia: tenta enviar o que falta, avisa o servidor e mantém os dados do aparelho. */
export async function logoutAcademy(): Promise<void> {
  const auth = await repos.academy.getSession()
  if (!auth) return
  await syncNow().catch(() => undefined)
  await apiRequest('/student/auth/logout', { method: 'POST', token: auth.token }).catch(
    () => undefined,
  )
  await endAcademySession('logout')
}
