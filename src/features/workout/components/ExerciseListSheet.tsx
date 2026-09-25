import { Check, Trash2 } from 'lucide-react'
import type { Session } from '@/domain/types'
import { cn } from '@/ui/cn'
import { Button } from '@/ui/components/Button'
import { Sheet } from '@/ui/components/Sheet'

export function ExerciseListSheet({
  session,
  open,
  onClose,
  onSelect,
  onDiscard,
}: {
  session: Session
  open: boolean
  onClose: () => void
  onSelect: (index: number) => void
  onDiscard: () => void
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Exercícios do treino"
      footer={
        <Button variant="danger" icon={<Trash2 className="size-5" />} onClick={onDiscard}>
          Descartar treino
        </Button>
      }
    >
      <ol className="space-y-1 pb-2">
        {session.exercises.map((e, i) => {
          const work = e.sets.filter((s) => !s.isWarmup)
          const done = work.filter((s) => s.completedAt).length
          const complete = work.length > 0 && done === work.length
          const current = i === session.currentExerciseIndex
          return (
            <li key={e.id}>
              <button
                type="button"
                aria-current={current ? 'step' : undefined}
                onClick={() => {
                  onSelect(i)
                  onClose()
                }}
                className={cn(
                  'flex min-h-16 w-full items-center gap-3 rounded-card px-3 text-left active:bg-surface-2',
                  current && 'bg-surface-2',
                )}
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    complete ? 'bg-success text-bg' : 'bg-surface-3 text-fg-muted',
                  )}
                >
                  {complete ? <Check className="size-5" strokeWidth={3} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{e.exerciseName}</span>
                  <span className="block text-sm text-fg-muted tabular">
                    {done}/{work.length} séries
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </Sheet>
  )
}
