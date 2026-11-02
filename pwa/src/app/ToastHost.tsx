import { X } from 'lucide-react'
import { useToastStore } from '@/stores/toastStore'
import { cn } from '@/ui/cn'

export function ToastHost() {
  const { toasts, dismiss } = useToastStore()
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === 'error' ? 'alert' : 'status'}
          className={cn(
            'toast-in pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-control py-1.5 pr-1.5 pl-4 shadow-sheet',
            t.tone === 'error' ? 'bg-danger text-white' : 'bg-fg text-bg',
          )}
        >
          <p className="flex-1 py-2 text-sm font-medium">{t.message}</p>
          {t.action && (
            <button
              type="button"
              className="min-h-11 rounded-lg px-3 text-sm font-bold text-accent brightness-110 active:opacity-70 dark:text-accent"
              onClick={() => {
                t.action?.onClick()
                dismiss(t.id)
              }}
            >
              {t.action.label}
            </button>
          )}
          <button
            type="button"
            aria-label="Fechar aviso"
            className="flex size-11 items-center justify-center rounded-lg opacity-70 active:opacity-100"
            onClick={() => dismiss(t.id)}
          >
            <X className="size-5" />
          </button>
        </div>
      ))}
    </div>
  )
}
