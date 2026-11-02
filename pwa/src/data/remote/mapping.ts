import type { AcademyPlanInfo, ISODate, Plan, Session } from '@/domain/types'
import type { RemoteProgram, RemoteWorkout } from './schemas'

/** Espaço de `order` por programa: as fichas de um treino ficam juntas e em sequência. */
const PROGRAM_ORDER_STRIDE = 100

/**
 * Converte os treinos da academia em fichas do app. Ids das fichas e dos exercícios são os do
 * servidor, então `planExerciseId` das sessões volta certinho para a academia.
 */
export function programsToPlans(
  programs: readonly RemoteProgram[],
  existing: ReadonlyMap<string, Plan>,
  now: ISODate,
  /** Programas marcados como vistos no app que ainda estão na fila de envio. */
  seenLocally: ReadonlySet<string> = new Set(),
): Plan[] {
  return programs.flatMap((program, programIndex) => {
    const info: AcademyPlanInfo = {
      programId: program.id,
      programName: program.name,
      author: program.author,
      expiresOn: program.expiresOn,
      expired: program.expired,
      isNew: program.isNew && !seenLocally.has(program.id),
      programNotes: program.notes,
    }
    return [...program.plans]
      .sort((a, b) => a.position - b.position)
      .map((plan, index): Plan => ({
        id: plan.id,
        createdAt: existing.get(plan.id)?.createdAt ?? now,
        updatedAt: program.updatedAt,
        name: plan.name,
        color: plan.color,
        order: programIndex * PROGRAM_ORDER_STRIDE + index,
        origin: 'academy',
        academy: info,
        exercises: plan.exercises.map((e) => ({
          id: e.id,
          exercise: e.exercise,
          sets: e.sets,
          repMin: Math.min(e.repMin, e.repMax),
          repMax: Math.max(e.repMin, e.repMax),
          loadKg: e.loadKg,
          restSec: e.restSec,
          incrementKg: e.incrementKg,
          notes: e.notes,
        })),
      }))
  })
}

/**
 * Reconcilia as fichas locais da academia com o que veio do servidor:
 * devolve as que precisam ser gravadas (novas, alteradas, reativadas e as que sumiram, arquivadas).
 */
export function reconcileAcademyPlans(
  local: readonly Plan[],
  incoming: readonly Plan[],
  now: ISODate,
): Plan[] {
  const incomingIds = new Set(incoming.map((p) => p.id))
  const localById = new Map(local.map((p) => [p.id, p]))
  const changed: Plan[] = incoming.filter((p) => {
    const current = localById.get(p.id)
    return !current || current.archivedAt || JSON.stringify(current) !== JSON.stringify(p)
  })
  for (const p of local) {
    if (p.origin === 'academy' && !p.archivedAt && !incomingIds.has(p.id)) {
      changed.push({ ...p, archivedAt: now, updatedAt: now })
    }
  }
  return changed
}

/** Arquiva todas as fichas da academia (logout ou acesso encerrado): o histórico continua válido. */
export function archiveAllAcademyPlans(local: readonly Plan[], now: ISODate): Plan[] {
  return local
    .filter((p) => p.origin === 'academy' && !p.archivedAt)
    .map((p) => ({ ...p, archivedAt: now, updatedAt: now }))
}

/** Sessão concluída → corpo de POST /workouts. */
export function sessionToRemote(session: Session): RemoteWorkout {
  return {
    id: session.id,
    planId: session.planId,
    planName: session.planName,
    startedAt: session.startedAt,
    finishedAt: session.finishedAt ?? session.updatedAt,
    exercises: session.exercises.map((e) => ({
      ...(e.planExerciseId ? { planExerciseId: e.planExerciseId } : {}),
      exercise: e.exercise,
      exerciseName: e.exerciseName,
      sets: e.sets.map((s) => ({
        weightKg: s.weightKg,
        reps: s.reps,
        isWarmup: s.isWarmup,
        ...(s.completedAt ? { completedAt: s.completedAt } : {}),
      })),
    })),
  }
}
