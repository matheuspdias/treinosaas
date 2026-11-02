import type Dexie from 'dexie'

/**
 * Histórico de versões do schema. NUNCA edite uma versão já publicada:
 * crie `db.version(n + 1)` com as mudanças e, se precisar transformar dados, um `.upgrade()`.
 * Cada nova versão precisa de teste em migrations.test.ts.
 */
export const DB_VERSION = 2

export function applyMigrations(db: Dexie): void {
  db.version(1).stores({
    plans: 'id, order',
    customExercises: 'id, name',
    mediaBlobs: 'id',
    sessions: 'id, planId, status, startedAt',
    settings: 'key',
  })

  // v2 (Fase 2): registros de peso corporal e medidas.
  db.version(2).stores({ bodyMetrics: 'id, date' })

  // Próxima versão: db.version(3).stores({ ... }).upgrade(async (tx) => { ... })
}
