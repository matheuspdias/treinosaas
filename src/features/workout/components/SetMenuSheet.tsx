import { Flame, Trash2, Weight } from 'lucide-react'
import type { SetLog } from '@/domain/types'
import { Button } from '@/ui/components/Button'
import { Sheet } from '@/ui/components/Sheet'

export function SetMenuSheet({
  set,
  label,
  onClose,
  onToggleWarmup,
  onRemove,
}: {
  set: SetLog | null
  label: string
  onClose: () => void
  onToggleWarmup: () => void
  onRemove: () => void
}) {
  return (
    <Sheet
      open={set !== null}
      onClose={onClose}
      title={set?.isWarmup ? 'Série de aquecimento' : `Série ${label}`}
    >
      {set && (
        <div className="grid gap-2 pt-2 pb-2">
          <Button
            variant="secondary"
            size="lg"
            icon={set.isWarmup ? <Weight className="size-5" /> : <Flame className="size-5" />}
            onClick={() => {
              onToggleWarmup()
              onClose()
            }}
          >
            {set.isWarmup ? 'Tornar série de trabalho' : 'Marcar como aquecimento'}
          </Button>
          <p className="px-1 pb-2 text-sm text-fg-subtle">
            Aquecimentos não contam para volume nem recordes.
          </p>
          <Button
            variant="danger"
            size="lg"
            icon={<Trash2 className="size-5" />}
            onClick={() => {
              onRemove()
              onClose()
            }}
          >
            Remover série
          </Button>
        </div>
      )}
    </Sheet>
  )
}
