import type { ID, ISODate } from '@/domain/types'
import type { RemoteWorkout } from '../remote/schemas'

/**
 * Item da fila de envio para a academia. Sobrevive a reload e fica esperando internet.
 * Cada item guarda o aluno: se outro aluno entrar no aparelho, a fila antiga não vai para ele.
 */
export type OutboxItem =
  | (OutboxBase & { kind: 'workout'; payload: RemoteWorkout })
  | (OutboxBase & { kind: 'seen'; programId: ID })

interface OutboxBase {
  /** Workout: id da sessão. Seen: `seen:<programId>`. */
  id: string
  studentId: ID
  createdAt: ISODate
  attempts: number
  /** Não tentar antes disso (espera crescente após falha). */
  nextAttemptAt: ISODate
}

/** Espera depois de `attempts` falhas: 30 s, 1, 2, 4... até 30 min. */
export function backoffMs(attempts: number): number {
  return Math.min(30 * 60_000, 30_000 * 2 ** Math.max(0, attempts - 1))
}
