import { db } from '@/data/db/db'

/** Limpa o banco global (o mesmo usado por `repos`) entre testes. */
export async function resetDatabase(): Promise<void> {
  await Promise.all(db.tables.map((t) => t.clear()))
}
