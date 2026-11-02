import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { cn } from '../cn'
import { IconButton } from './IconButton'

export interface SheetProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  className?: string
}

/**
 * Painel que sobe de baixo (no celular) ou diálogo centralizado (telas largas).
 * Usa <dialog> nativo: foco preso, Esc fecha e o fundo fica inerte.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className={cn(
        'sheet m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-[1.75rem] bg-surface p-0 text-fg shadow-sheet backdrop:bg-black/60 sm:m-auto sm:max-w-lg sm:rounded-[1.75rem]',
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[92dvh] flex-col safe-bottom">
          <div
            className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-surface-3 sm:hidden"
            aria-hidden
          />
          <div className="flex items-start gap-2 px-5 pt-3 pb-2">
            <div className="min-w-0 flex-1 pt-2">
              <h2 id={titleId} className="text-lg font-bold">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-fg-muted">
                  {description}
                </p>
              )}
            </div>
            <IconButton
              label="Fechar"
              icon={<X className="size-6" />}
              onClick={onClose}
              className="-mr-2"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
          {footer && (
            <div className="flex flex-col gap-2 border-t border-border px-5 py-4">{footer}</div>
          )}
        </div>
      )}
    </dialog>
  )
}
