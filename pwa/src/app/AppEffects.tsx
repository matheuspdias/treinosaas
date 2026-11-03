import { useEffect } from 'react'
import { useSettings } from '@/data/hooks'
import { startAcademySync } from '@/data/sync'
import { applyTheme } from '@/ui/theme/theme'
import { usePlanImagePrefetch } from '@/features/plans/usePlanImagePrefetch'

/** Efeitos globais sem UI: tema, cache offline das imagens e sincronização com a academia. */
export function AppEffects() {
  const { theme } = useSettings()
  useEffect(() => applyTheme(theme), [theme])
  // Só sincroniza se houver aluno logado.
  useEffect(() => startAcademySync(), [])
  usePlanImagePrefetch()
  return null
}
