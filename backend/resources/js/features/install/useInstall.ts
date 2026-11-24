import { useSyncExternalStore } from 'react'
import {
  getInstallSnapshot,
  installPlatform,
  isStandalone,
  subscribeInstall,
  type InstallPlatform,
  type InstallSnapshot,
} from '@/lib/install'

const PLATFORM: InstallPlatform =
  typeof navigator === 'undefined'
    ? 'desktop'
    : installPlatform(navigator.userAgent, navigator.maxTouchPoints)
const STANDALONE = typeof window !== 'undefined' && isStandalone()

export function useInstall(): InstallSnapshot & {
  platform: InstallPlatform
  standalone: boolean
  /** No celular, fora do app instalado: mostra a tela de instalação. */
  ask: boolean
} {
  const snapshot = useSyncExternalStore(subscribeInstall, getInstallSnapshot)
  return {
    ...snapshot,
    platform: PLATFORM,
    standalone: STANDALONE,
    ask: PLATFORM !== 'desktop' && !STANDALONE && !snapshot.skipped,
  }
}
