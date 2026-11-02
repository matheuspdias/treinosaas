import { loadCatalog } from '@/catalog/catalog'
import { repos } from '@/data'
import { enqueueWorkout } from '@/data/sync'
import { isAcademyPlan } from '@/domain/academy'
import { EXERCISE_NAMES_PT_BR } from '@/catalog/i18n/pt-BR'
import { createSessionFromPlan, finishSession, syncPlanLoads } from '@/domain/session'
import type { ExerciseRef, Plan, Session } from '@/domain/types'
import { unlockAudio } from '@/lib/sound'
import { confirm } from '@/stores/confirmStore'

async function resolveNames(): Promise<(ref: ExerciseRef) => string> {
  const [catalog, custom] = await Promise.all([loadCatalog(), repos.customExercises.list()])
  const catalogNames = new Map(catalog.map((e) => [e.ref.id, e.name]))
  const customNames = new Map(custom.map((e) => [e.id, e.name]))
  return (ref) =>
    (ref.source === 'custom'
      ? customNames.get(ref.id)
      : (catalogNames.get(ref.id) ?? EXERCISE_NAMES_PT_BR[ref.id]?.name)) ??
    ref.id.replace(/_/g, ' ')
}

/**
 * Inicia um treino a partir da ficha. Se já houver um em andamento, pergunta antes de descartá-lo.
 * Retorna a sessão criada, ou null se o usuário desistiu.
 */
export async function startWorkout(plan: Plan): Promise<Session | null> {
  unlockAudio()
  const active = await repos.sessions.getActive()
  if (active) {
    if (active.planId === plan.id) return active
    const ok = await confirm({
      title: 'Já existe um treino em andamento',
      description: `"${active.planName}" ainda não foi finalizado. Para começar "${plan.name}", o treino atual será descartado.`,
      confirmLabel: 'Descartar e começar',
      cancelLabel: 'Manter o atual',
      tone: 'danger',
    })
    if (!ok) return null
    await repos.sessions.remove(active.id)
  }
  const [history, resolveName] = await Promise.all([repos.sessions.listCompleted(), resolveNames()])
  const session = createSessionFromPlan({ plan, history, resolveName })
  await repos.sessions.save(session)
  return session
}

/**
 * Finaliza, salva e atualiza a "carga atual" da ficha. Ficha da academia não muda (é a
 * prescrição do instrutor): o treino vai para a fila de envio e as cargas ficam no histórico.
 */
export async function completeWorkout(session: Session): Promise<Session> {
  const finished = finishSession(session)
  await repos.sessions.save(finished)
  const plan = await repos.plans.get(session.planId)
  if (plan && isAcademyPlan(plan)) {
    await enqueueWorkout(finished)
  } else if (plan) {
    const synced = syncPlanLoads(plan, finished, finished.finishedAt!)
    if (synced !== plan) await repos.plans.save(synced)
  }
  return finished
}

export async function discardWorkout(session: Session): Promise<void> {
  await repos.sessions.remove(session.id)
}
