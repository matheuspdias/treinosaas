import { Dumbbell, MoreVertical, Play, Plus, Share2, StickyNote } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { usePlan, usePlans, useSettings } from '@/data/hooks'
import { isAcademyPlan } from '@/domain/academy'
import { formatClock } from '@/domain/duration'
import { moveItem } from '@/domain/plan'
import type { PlanExercise } from '@/domain/types'
import { formatWeight } from '@/domain/units'
import { AcademyPlanView } from '@/features/academy/AcademyPlanView'
import { ExerciseThumb } from '@/features/exercises/components/ExerciseThumb'
import { useExerciseLookup } from '@/features/exercises/hooks/useExerciseLookup'
import { SharePlanSheet } from '@/features/share/SharePlanSheet'
import { startWorkout } from '@/features/workout/workoutActions'
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
import { PlanExerciseSheet } from './components/PlanExerciseSheet'
import { PlanSettingsSheet } from './components/PlanSettingsSheet'
import { reorderPlanExercises } from './planActions'
import { planLetters } from './planLetters'

export function PlanEditorPage() {
  const { planId } = useParams()
  const plan = usePlan(planId)
  const plans = usePlans()
  const settings = useSettings()
  const lookup = useExerciseLookup()
  const navigate = useNavigate()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [optimistic, setOptimistic] = useState<PlanExercise[] | null>(null)
  const [shareOpen, setShareOpen] = useState(false)

  const letter = useMemo(
    () => (plans && plan ? (planLetters(plans).get(plan.id) ?? '') : ''),
    [plans, plan],
  )

  if (plan === undefined) return <PageSpinner />
  if (plan === null) {
    return (
      <EmptyState
        title="Ficha não encontrada"
        action={
          <Link to="/fichas" className={buttonClass({ block: true })}>
            Ver fichas
          </Link>
        }
      />
    )
  }

  if (isAcademyPlan(plan)) return <AcademyPlanView plan={plan} letter={letter} />

  const exercises = optimistic ?? plan.exercises
  const editingIndex = exercises.findIndex((e) => e.id === editingId)
  const editing = editingIndex >= 0 ? exercises[editingIndex]! : null

  const start = async () => {
    const session = await startWorkout(plan)
    if (session) navigate('/treino')
  }

  return (
    <>
      <PageHeader
        back="/fichas"
        title={plan.name}
        subtitle={plan.archivedAt ? 'Arquivada' : undefined}
        actions={
          <>
            {plan.exercises.length > 0 && (
              <IconButton
                label="Compartilhar ficha"
                icon={<Share2 className="size-5" />}
                onClick={() => setShareOpen(true)}
              />
            )}
            <IconButton
              label="Configurar ficha"
              icon={<MoreVertical className="size-5" />}
              onClick={() => setSettingsOpen(true)}
            />
          </>
        }
      />

      <div className="px-4 pb-8">
        <Card className="mb-5 flex items-center gap-4 p-4">
          <PlanBadge letter={letter} color={plan.color} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-fg-muted">
              {plan.exercises.length === 1 ? '1 exercício' : `${plan.exercises.length} exercícios`}
            </p>
            <p className="text-sm text-fg-muted">
              {plan.exercises.reduce((n, e) => n + e.sets, 0)} séries no total
            </p>
          </div>
          {plan.exercises.length > 0 && !plan.archivedAt && (
            <Button icon={<Play className="size-5 fill-current" />} onClick={start}>
              Iniciar
            </Button>
          )}
        </Card>

        {exercises.length === 0 ? (
          <EmptyState
            icon={<Dumbbell className="size-8" />}
            title="Ficha vazia"
            description="Adicione os exercícios na ordem em que você faz."
          />
        ) : (
          <SortableList
            items={exercises}
            getId={(e) => e.id}
            getLabel={(e) => lookup.name(e.exercise)}
            className="space-y-2"
            onReorder={(from, to) => {
              setOptimistic(moveItem(exercises, from, to))
              void reorderPlanExercises(plan.id, from, to).finally(() => setOptimistic(null))
            }}
            renderItem={(e, handle, dragging, index) => {
              const name = lookup.name(e.exercise)
              return (
                <Card
                  className={cn(
                    'flex items-center gap-1 py-2 pr-2 pl-1',
                    dragging && 'shadow-sheet ring-2 ring-accent',
                  )}
                >
                  <DragHandle {...handle} label={name} />
                  <button
                    type="button"
                    onClick={() => setEditingId(e.id)}
                    className="flex min-h-touch min-w-0 flex-1 items-center gap-3 rounded-control text-left active:opacity-70"
                  >
                    <ExerciseThumb exRef={e.exercise} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-fg-subtle">
                        {index + 1}
                      </span>
                      <span className="block truncate font-semibold">{name}</span>
                      <span className="block text-sm text-fg-muted tabular">
                        {e.sets} × {e.repMin === e.repMax ? e.repMin : `${e.repMin}–${e.repMax}`}
                        {e.loadKg > 0 && ` · ${formatWeight(e.loadKg, settings.weightUnit)}`} ·{' '}
                        {formatClock(e.restSec)}
                      </span>
                      {e.notes && (
                        <span className="mt-0.5 flex items-center gap-1 truncate text-sm text-fg-subtle">
                          <StickyNote className="size-3.5 shrink-0" aria-hidden />
                          <span className="truncate">{e.notes}</span>
                        </span>
                      )}
                    </span>
                  </button>
                </Card>
              )
            }}
          />
        )}

        <Link
          to={`/fichas/${plan.id}/adicionar`}
          className={cn(buttonClass({ variant: 'secondary', block: true, size: 'lg' }), 'mt-4')}
        >
          <Plus className="size-5" />
          Adicionar exercícios
        </Link>
      </div>

      <PlanExerciseSheet
        planId={plan.id}
        exercise={editing}
        index={editingIndex}
        name={editing ? lookup.name(editing.exercise) : ''}
        unit={settings.weightUnit}
        onClose={() => setEditingId(null)}
      />
      <PlanSettingsSheet plan={plan} open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <SharePlanSheet
        plan={plan}
        letter={letter || 'A'}
        unit={settings.weightUnit}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </>
  )
}
