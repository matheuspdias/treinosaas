import { usePage } from '@inertiajs/react'
import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { SharedData } from '@/types'
import { cn } from '@/ui/cn'

/** Mensagem de sucesso/erro do servidor (session flash), igual ao toast do app. */
export function FlashToast() {
  const { flash } = usePage<SharedData>().props
  const message = flash.error ?? flash.success
  const tone = flash.error ? 'error' : 'success'
  const [dismissed, setDismissed] = useState<string | null>(null)
  const [last, setLast] = useState(message)

  if (message !== last) {
    setLast(message)
    setDismissed(null)
  }

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setDismissed(message), 5000)
    return () => clearTimeout(t)
  }, [message])

  if (!message || dismissed === message) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 flex justify-center px-4 lg:bottom-6 lg:pl-72"
    >
      <div
        className={cn(
          'toast-in flex max-w-md items-start gap-3 rounded-card bg-fg px-4 py-3 text-bg shadow-sheet',
        )}
      >
        {tone === 'error' ? (
          <CircleAlert className="mt-0.5 size-5 shrink-0 text-danger" />
        ) : (
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-accent" />
        )}
        <p className="flex-1 font-medium">{message}</p>
        <button
          type="button"
          aria-label="Fechar aviso"
          onClick={() => setDismissed(message)}
          className="-mr-1 opacity-70"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>
  )
}
