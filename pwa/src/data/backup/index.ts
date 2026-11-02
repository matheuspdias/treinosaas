import { db } from '../db/db'
import { syncNow } from '../sync/academySync'
import { createBackup, parseBackup, restoreBackup } from './backup'
import type { BackupFile } from './schema'

export type { BackupSummary, ParseBackupResult } from './backup'
export type { BackupFile } from './schema'
export { parseBackup }

export const exportBackup = (): Promise<BackupFile> => createBackup(db)
/** Restaura e, se o aluno estiver numa academia, busca de novo as fichas dela (não vão no backup). */
export async function importBackup(backup: BackupFile): Promise<void> {
  await restoreBackup(db, backup)
  void syncNow()
}
