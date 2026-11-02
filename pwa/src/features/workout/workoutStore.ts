import { create } from 'zustand'
import { repos } from '@/data'
import type { Session } from '@/domain/types'

/**
 * Cache em memória do treino em andamento, com escrita imediata no IndexedDB.
 *
 * O IndexedDB é a fonte da verdade (o treino sobrevive a fechar o app); este store existe
 * para que toques rápidos em sequência sempre partam do estado mais recente, sem esperar
 * a leitura assíncrona do banco. As gravações são serializadas numa fila.
 */
interface WorkoutState {
  session: Session | null
  status: 'idle' | 'loading' | 'ready'
  load: () => Promise<void>
  apply: (fn: (session: Session) => Session) => void
  clear: () => void
}

let writes: Promise<unknown> = Promise.resolve()

export function flushWorkoutWrites(): Promise<unknown> {
  return writes
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  session: null,
  status: 'idle',
  async load() {
    set({ status: 'loading' })
    await writes
    const session = (await repos.sessions.getActive()) ?? null
    set({ session, status: 'ready' })
  },
  apply(fn) {
    const current = get().session
    if (!current) return
    const next = fn(current)
    if (next === current) return
    set({ session: next })
    writes = writes.then(() => repos.sessions.save(next)).catch(() => undefined)
  },
  clear() {
    set({ session: null, status: 'idle' })
  },
}))
