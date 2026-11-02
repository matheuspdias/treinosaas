import type { ReactNode } from 'react'
import { Button } from './Button'
import { Sheet } from './Sheet'

export function ConfirmSheet({
  open,
  title,
  description,
  confirmLabel,
  danger,
  processing,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel: string
  danger?: boolean
  processing?: boolean
  onConfirm: () => void
  onClose: () => void
  children?: ReactNode
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button
            variant={danger ? 'danger' : 'primary'}
            block
            disabled={processing}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
          <Button variant="ghost" block onClick={onClose}>
            Cancelar
          </Button>
        </>
      }
    >
      {children}
    </Sheet>
  )
}
