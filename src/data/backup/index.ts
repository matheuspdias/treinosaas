import { db } from '../db/db'
import { createBackup, parseBackup, restoreBackup } from './backup'
import type { BackupFile } from './schema'

export type { BackupSummary, ParseBackupResult } from './backup'
export type { BackupFile } from './schema'
export { parseBackup }

export const exportBackup = (): Promise<BackupFile> => createBackup(db)
export const importBackup = (backup: BackupFile): Promise<void> => restoreBackup(db, backup)
