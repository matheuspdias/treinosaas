import { useEffect } from 'react'
import { RouterProvider } from 'react-router'
import { refreshBranding } from '@/data/branding'
import { useBranding } from '@/data/hooks'
import { NoAcademyPage } from '@/features/academy/NoAcademyPage'
import { PageSpinner } from '@/ui/components/Spinner'
import { AppEffects } from './AppEffects'
import { applyBranding } from './brandHead'
import { ConfirmHost } from './ConfirmHost'
import { router } from './router'
import { ToastHost } from './ToastHost'
import { UpdatePrompt } from './UpdatePrompt'

export function App() {
  const branding = useBranding()
  useEffect(() => void refreshBranding(), [])
  useEffect(() => applyBranding(branding), [branding])

  // O app só existe dentro de uma academia: /{slug}/...
  if (branding.status === 'none') return <NoAcademyPage />
  if (branding.status === 'not_found') return <NoAcademyPage notFound />
  if (branding.status === 'loading') return <PageSpinner />

  return (
    <>
      <AppEffects />
      <RouterProvider router={router} />
      <ToastHost />
      <ConfirmHost />
      <UpdatePrompt />
    </>
  )
}
