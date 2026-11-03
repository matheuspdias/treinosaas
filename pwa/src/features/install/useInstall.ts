import { useSyncExternalStore } from 'react'
import { installPlatform, shouldAskInstall } from '@/domain/install'
import type { InstallPlatform } from '@/domain/install'
import { getInstallSnapshot, isStandalone, subscribeInstall } from '@/lib/install'
import type { InstallSnapshot } from '@/lib/install'

const PLATFORM: InstallPlatform =
  typeof navigator === 'undefined'
    ? 'desktop'
    : installPlatform(navigator.userAgent, navigator.maxTouchPoints)
const STANDALONE = typeof window !== 'undefined' && isStandalone()

export function useInstall(): InstallSnapshot & { platform: InstallPlatform; ask: boolean } {
  const snapshot = useSyncExternalStore(subscribeInstall, getInstallSnapshot)
  return {
    ...snapshot,
    platform: PLATFORM,
    ask: shouldAskInstall(PLATFORM, STANDALONE, snapshot.skipped),
  }
}
