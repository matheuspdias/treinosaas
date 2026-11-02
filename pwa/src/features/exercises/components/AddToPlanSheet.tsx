import { Link } from 'react-router'
import { usePlans } from '@/data/hooks'
import { isActivePlan, sortByOrder } from '@/domain/sequence'
import type { ExerciseRef } from '@/domain/types'
import { PlanBadge } from '@/features/plans/components/PlanBadge'
import { addExercisesToPlan, createNextPlan } from '@/features/plans/planActions'
import { planLetters } from '@/features/plans/planLetters'
import { toast } from '@/stores/toastStore'
import { buttonClass } from '@/ui/components/buttonClass'
import { Sheet } from '@/ui/components/Sheet'

export function AddToPlanSheet({
  exRef,
  name,
  open,
  onClose,
  onAdded,
}: {
  exRef: ExerciseRef
  name: string
  open: boolean
  onClose: () => void
  onAdded: (planId: string) => void
}) {
  const plans = usePlans() ?? []
  const active = sortByOrder(plans.filter(isActivePlan))
  const letters = planLetters(plans)

  const add = async (planId: string, planName: string) => {
    await addExercisesToPlan(planId, [exRef])
    onClose()
    toast(`${name} adicionado a ${planName}.`, {
      tone: 'success',
      action: { label: 'Ver ficha', onClick: () => onAdded(planId) },
    })
  }

  return (
    <Sheet open={open} onClose={onClose} title="Adicionar a qual ficha?">
      {active.length === 0 ? (
        <div className="py-4">
          <p className="mb-4 text-fg-muted">Você ainda não tem fichas.</p>
          <button
            type="button"
            className={buttonClass({ block: true, size: 'lg' })}
            onClick={async () => {
              const plan = await createNextPlan()
              await add(plan.id, plan.name)
            }}
          >
            Criar ficha com este exercício
          </button>
        </div>
      ) : (
        <ul className="space-y-1 pb-2">
          {active.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => void add(p.id, p.name)}
                className="flex min-h-16 w-full items-center gap-3 rounded-card px-2 text-left active:bg-surface-2"
              >
                <PlanBadge letter={letters.get(p.id) ?? ''} color={p.color} />
                <span className="flex-1 font-semibold">{p.name}</span>
                <span className="text-sm text-fg-subtle">{p.exercises.length} ex.</span>
              </button>
            </li>
          ))}
          <li>
            <Link
              to="/fichas"
              className="flex min-h-touch items-center px-2 text-sm font-semibold text-fg-muted"
              onClick={onClose}
            >
              Gerenciar fichas
            </Link>
          </li>
        </ul>
      )}
    </Sheet>
  )
}
