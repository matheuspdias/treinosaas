import { RouterProvider } from 'react-router'
import { AppEffects } from './AppEffects'
import { ConfirmHost } from './ConfirmHost'
import { router } from './router'
import { ToastHost } from './ToastHost'
import { UpdatePrompt } from './UpdatePrompt'

export function App() {
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
