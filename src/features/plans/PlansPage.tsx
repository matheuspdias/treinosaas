import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  LayoutTemplate,
  MoreVertical,
  Plus,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { usePlans } from '@/data/hooks'
import { moveItem } from '@/domain/plan'
import { isActivePlan, sortByOrder } from '@/domain/sequence'
import type { Plan } from '@/domain/types'
import { cn } from '@/ui/cn'
import { Button } from '@/ui/components/Button'
import { buttonClass } from '@/ui/components/buttonClass'
import { Card } from '@/ui/components/Card'
import { EmptyState } from '@/ui/components/EmptyState'
import { IconButton } from '@/ui/components/IconButton'
import { PageHeader } from '@/ui/components/PageHeader'
import { DragHandle, SortableList } from '@/ui/components/SortableList'
import { PageSpinner } from '@/ui/components/Spinner'
import { PlanBadge } from './components/PlanBadge'
import { PlanSettingsSheet } from './components/PlanSettingsSheet'
import { createNextPlan, reorderActivePlans } from './planActions'
import { planLetters } from './planLetters'

function exerciseCount(plan: Plan): string {
  const n = plan.exercises.length
  return n === 0 ? 'Sem exercícios' : n === 1 ? '1 exercício' : `${n} exercícios`
}

export function PlansPage() {
  const plans = usePlans()
  const navigate = useNavigate()
  const [editing, setEditing] = useState<Plan | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  // Ordem otimista durante o arraste (evita "pulo" até o IndexedDB responder).
  const [optimistic, setOptimistic] = useState<string[] | null>(null)

  const { active, archived, letters } = useMemo(() => {
    const all = plans ?? []
    const activeList = sortByOrder(all.filter(isActivePlan))
    const ordered = optimistic
      ? optimistic.map((id) => activeList.find((p) => p.id === id)).filter((p): p is Plan => !!p)
      : activeList
    return {
      active: ordered.length === activeList.length ? ordered : activeList,
      archived: all.filter((p) => p.archivedAt),
      letters: planLetters(all),
    }
  }, [plans, optimistic])

  const create = async () => {
    const plan = await createNextPlan()
    navigate(`/fichas/${plan.id}`)
  }

  if (!plans) return <PageSpinner />
  const editingPlan = editing ? (plans.find((p) => p.id === editing.id) ?? null) : null

  return (
    <>
      <PageHeader
        title="Fichas"
        subtitle={active.length > 0 ? 'Arraste para mudar a sequência' : undefined}
        actions={
          <IconButton
            label="Nova ficha"
            variant="primary"
            icon={<Plus className="size-6" />}
            onClick={create}
          />
        }
      />

      {active.length === 0 && archived.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-8" />}
          title="Nenhuma ficha ainda"
          description="Monte seus treinos (A, B, C...) com os exercícios, séries e cargas que você faz."
          action={
            <div className="grid gap-2">
              <Button size="lg" block icon={<Plus className="size-5" />} onClick={create}>
                Criar primeira ficha
              </Button>
              <Link
                to="/fichas/modelos"
                className={buttonClass({ variant: 'secondary', block: true })}
              >
                <LayoutTemplate className="size-5" />
                Usar um modelo pronto
              </Link>
            </div>
          }
        />
      ) : (
        <div className="px-4 pb-6">
          <SortableList
            items={active}
            getId={(p) => p.id}
            getLabel={(p) => p.name}
            className="space-y-3"
            onReorder={(from, to) => {
              const ids = moveItem(
                active.map((p) => p.id),
                from,
                to,
              )
              setOptimistic(ids)
              void reorderActivePlans(ids).finally(() => setOptimistic(null))
            }}
            renderItem={(plan, handle, dragging) => (
              <Card
                className={cn(
                  'flex items-center gap-1 py-2 pr-1 pl-1',
                  dragging && 'shadow-sheet ring-2 ring-accent',
                )}
              >
                <DragHandle {...handle} label={plan.name} />
                <Link
                  to={`/fichas/${plan.id}`}
                  className="flex min-h-touch min-w-0 flex-1 items-center gap-3 rounded-control py-1 active:opacity-70"
                >
                  <PlanBadge letter={letters.get(plan.id) ?? '?'} color={plan.color} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-bold">{plan.name}</span>
                    <span className="block text-sm text-fg-muted">{exerciseCount(plan)}</span>
                  </span>
                </Link>
                <IconButton
                  label={`Configurar ${plan.name}`}
                  icon={<MoreVertical className="size-5" />}
                  onClick={() => setEditing(plan)}
                />
              </Card>
            )}
          />

          <Button
            variant="secondary"
            block
            className="mt-4"
            icon={<Plus className="size-5" />}
            onClick={create}
          >
            Nova ficha
          </Button>
          <Link
            to="/fichas/modelos"
            className={cn(buttonClass({ variant: 'ghost', block: true }), 'mt-2')}
          >
            <LayoutTemplate className="size-5" />
            Adicionar de um modelo pronto
          </Link>

          {archived.length > 0 && (
            <section className="mt-8">
              <button
                type="button"
                aria-expanded={showArchived}
                onClick={() => setShowArchived((v) => !v)}
                className="flex min-h-touch w-full items-center gap-2 font-semibold text-fg-muted"
              >
                {showArchived ? (
                  <ChevronDown className="size-5" />
                ) : (
                  <ChevronRight className="size-5" />
                )}
                Arquivadas ({archived.length})
              </button>
              {showArchived && (
                <ul className="mt-2 space-y-2">
                  {archived.map((plan) => (
                    <li key={plan.id}>
                      <Card className="flex items-center gap-3 py-2 pr-1 pl-3 opacity-80">
                        <PlanBadge letter="–" color={plan.color} />
                        <Link to={`/fichas/${plan.id}`} className="min-w-0 flex-1 py-2">
                          <span className="block truncate font-semibold">{plan.name}</span>
                          <span className="block text-sm text-fg-muted">{exerciseCount(plan)}</span>
                        </Link>
                        <IconButton
                          label={`Configurar ${plan.name}`}
                          icon={<MoreVertical className="size-5" />}
                          onClick={() => setEditing(plan)}
                        />
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}

      <PlanSettingsSheet
        plan={editingPlan}
        open={editing !== null}
        onClose={() => setEditing(null)}
      />
    </>
  )
}
