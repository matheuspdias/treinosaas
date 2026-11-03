import { academyPlans, isAcademyPlan } from '@/domain/academy'
import type { AcademySession, ID, Session } from '@/domain/types'
import { repos } from '../index'
import { ApiError, apiRequest } from '../remote/client'
import {
  archiveAllAcademyPlans,
  programsToPlans,
  reconcileAcademyPlans,
  sessionToRemote,
} from '../remote/mapping'
import {
  assessmentsResponseSchema,
  noticesResponseSchema,
  programsResponseSchema,
  workoutsResponseSchema,
} from '../remote/schemas'
import { backoffMs } from './outbox'
import type { OutboxItem } from './outbox'

/*
 * Sincronização com a academia. Nunca bloqueia a tela: tudo roda em segundo plano, com fila
 * offline (IndexedDB). Ordem: primeiro envia (treinos, "visto"), depois busca os treinos.
 */

const WORKOUT_BATCH = 50
const MAX_SEEN_ATTEMPTS = 8
const nowIso = () => new Date().toISOString()

export type EndReason = 'logout' | 'inactive' | 'unauthenticated'

const END_MESSAGES: Record<Exclude<EndReason, 'logout'>, string> = {
  inactive: 'Seu acesso pela academia foi encerrado. Fale com a academia.',
  unauthenticated: 'Sua sessão da academia expirou. Entre de novo para receber seus treinos.',
}

/** Coloca na fila um treino concluído, se ele foi feito numa ficha da academia. */
export async function enqueueWorkout(session: Session): Promise<boolean> {
  const auth = await repos.academy.getSession()
  const plan = await repos.plans.get(session.planId)
  if (!auth || !plan || !isAcademyPlan(plan) || session.status !== 'completed') return false
  const now = nowIso()
  await repos.outbox.put({
    id: session.id,
    kind: 'workout',
    studentId: auth.student.id,
    payload: sessionToRemote(session),
    createdAt: now,
    attempts: 0,
    nextAttemptAt: now,
  })
  void syncNow()
  return true
}

/** Aluno viu o treino novo: some o aviso na hora e a academia fica sabendo quando houver internet. */
export async function markProgramSeen(programId: ID): Promise<void> {
  const auth = await repos.academy.getSession()
  if (!auth) return
  const plans = (await repos.plans.list()).filter(
    (p) => p.academy?.programId === programId && p.academy.isNew,
  )
  await repos.plans.saveMany(plans.map((p) => ({ ...p, academy: { ...p.academy!, isNew: false } })))
  const now = nowIso()
  await repos.outbox.put({
    id: `seen:${programId}`,
    kind: 'seen',
    programId,
    studentId: auth.student.id,
    createdAt: now,
    attempts: 0,
    nextAttemptAt: now,
  })
  void syncNow()
}

let running: Promise<void> | null = null

/** Envia a fila e busca os treinos. Chamadas simultâneas compartilham a mesma execução. */
export function syncNow(): Promise<void> {
  running ??= run().finally(() => {
    running = null
  })
  return running
}

async function run(): Promise<void> {
  const auth = await repos.academy.getSession()
  if (!auth) return
  try {
    await pushOutbox(auth)
    await pullAll(auth)
    await repos.academy.updateFeed({ lastSyncAt: nowIso(), lastError: null, blocked: null })
  } catch (error) {
    if (error instanceof ApiError && error.kind === 'blocked') {
      // Fica guardado: o app continua bloqueado offline até a academia ser reativada.
      await repos.academy.updateFeed({
        blocked: { code: error.code ?? 'blocked', message: error.message },
        lastError: null,
      })
      return
    }
    if (error instanceof ApiError && error.kind === 'auth') {
      await endAcademySession(error.code === 'inactive' ? 'inactive' : 'unauthenticated')
      return
    }
    const message = error instanceof ApiError ? error.message : 'Falha ao sincronizar.'
    await repos.academy.updateFeed({ lastError: message })
  }
}

export async function pushOutbox(auth: AcademySession, now = Date.now()): Promise<void> {
  const items = await repos.outbox.list()
  // Fila de outro aluno que usou o aparelho antes: não vai para este.
  const foreign = items.filter((i) => i.studentId !== auth.student.id)
  if (foreign.length > 0) await repos.outbox.remove(foreign.map((i) => i.id))

  const due = items.filter(
    (i) => i.studentId === auth.student.id && Date.parse(i.nextAttemptAt) <= now,
  )
  const workouts = due.filter((i) => i.kind === 'workout')
  for (let i = 0; i < workouts.length; i += WORKOUT_BATCH) {
    const batch = workouts.slice(i, i + WORKOUT_BATCH)
    try {
      const result = await apiRequest('/student/workouts', {
        method: 'POST',
        token: auth.token,
        body: { sessions: batch.map((b) => b.payload) },
        schema: workoutsResponseSchema,
      })
      await repos.outbox.remove([...result.accepted, ...result.rejected])
    } catch (error) {
      await retryLater(batch, error, now)
    }
  }

  for (const item of due.filter((i) => i.kind === 'seen')) {
    try {
      await apiRequest(`/student/programs/${encodeURIComponent(item.programId)}/seen`, {
        method: 'POST',
        token: auth.token,
      })
      await repos.outbox.remove([item.id])
    } catch (error) {
      if (item.attempts + 1 >= MAX_SEEN_ATTEMPTS && !stopsSync(error)) {
        await repos.outbox.remove([item.id])
      } else {
        await retryLater([item], error, now)
      }
    }
  }
}

/** Sessão encerrada ou acesso bloqueado: para tudo e mantém a fila. */
function stopsSync(error: unknown): boolean {
  return error instanceof ApiError && (error.kind === 'auth' || error.kind === 'blocked')
}

async function retryLater(items: OutboxItem[], error: unknown, now: number): Promise<void> {
  if (stopsSync(error)) throw error
  for (const item of items) {
    const attempts = item.attempts + 1
    await repos.outbox.put({
      ...item,
      attempts,
      nextAttemptAt: new Date(now + backoffMs(attempts)).toISOString(),
    })
  }
  // Sem internet: para aqui, o resto espera o próximo gatilho.
  if (error instanceof ApiError && error.kind === 'offline') throw error
}

export async function pullAll(auth: AcademySession): Promise<void> {
  const [programs, notices, assessments, outbox] = await Promise.all([
    apiRequest('/student/programs', { token: auth.token, schema: programsResponseSchema }),
    apiRequest('/student/notices', { token: auth.token, schema: noticesResponseSchema }),
    apiRequest('/student/assessments', { token: auth.token, schema: assessmentsResponseSchema }),
    repos.outbox.list(),
  ])
  const now = nowIso()
  const local = await repos.plans.list()
  const seen = new Set(outbox.flatMap((i) => (i.kind === 'seen' ? [i.programId] : [])))
  const incoming = programsToPlans(
    programs.programs,
    new Map(local.map((p) => [p.id, p])),
    now,
    seen,
  )
  const changed = reconcileAcademyPlans(academyPlans(local), incoming, now)
  if (changed.length > 0) await repos.plans.saveMany(changed)
  await repos.academy.updateFeed({
    notices: notices.notices,
    assessments: assessments.assessments,
  })
}

/**
 * Sai do modo academia. Os dados do aparelho continuam: treinos feitos ficam no histórico e as
 * fichas da academia ficam arquivadas (a sequência e os gráficos continuam corretos).
 */
export async function endAcademySession(reason: EndReason): Promise<void> {
  const auth = await repos.academy.getSession()
  await repos.academy.clearSession()
  await repos.plans.saveMany(archiveAllAcademyPlans(await repos.plans.list(), nowIso()))
  // Token só expirou: a fila espera o aluno entrar de novo. Nos outros casos, não há para onde enviar.
  if (reason !== 'unauthenticated' && auth) {
    const items = await repos.outbox.list()
    await repos.outbox.remove(items.filter((i) => i.studentId === auth.student.id).map((i) => i.id))
  }
  await repos.academy.updateFeed({
    notices: [],
    assessments: [],
    lastError: reason === 'logout' ? null : END_MESSAGES[reason],
    blocked: null,
  })
}

const VISIBLE_THROTTLE_MS = 60_000
const INTERVAL_MS = 10 * 60_000

/** Gatilhos de sincronização: abertura do app, volta da internet, volta para o app e a cada 10 min. */
export function startAcademySync(): () => void {
  let lastVisible = Date.now()
  const onOnline = () => void syncNow()
  const onVisible = () => {
    if (document.visibilityState !== 'visible') return
    if (Date.now() - lastVisible < VISIBLE_THROTTLE_MS) return
    lastVisible = Date.now()
    void syncNow()
  }
  const timer = window.setInterval(() => {
    if (document.visibilityState === 'visible') void syncNow()
  }, INTERVAL_MS)
  window.addEventListener('online', onOnline)
  document.addEventListener('visibilitychange', onVisible)
  void syncNow()
  return () => {
    window.clearInterval(timer)
    window.removeEventListener('online', onOnline)
    document.removeEventListener('visibilitychange', onVisible)
  }
}
