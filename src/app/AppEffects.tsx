import { useEffect } from 'react'
import { useSettings } from '@/data/hooks'
import { applyTheme } from '@/ui/theme/theme'
import { usePlanImagePrefetch } from '@/features/plans/usePlanImagePrefetch'

/** Efeitos globais sem UI: tema e cache offline das imagens das fichas. */
export function AppEffects() {
  const { theme } = useSettings()
  useEffect(() => applyTheme(theme), [theme])
  usePlanImagePrefetch()
  return null
}
