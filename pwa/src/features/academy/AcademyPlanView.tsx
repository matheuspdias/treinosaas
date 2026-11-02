import { Building2, CalendarClock, Dumbbell, MessageSquareText, Play } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { useSettings } from '@/data/hooks'
import { markProgramSeen } from '@/data/sync'
import { formatClock } from '@/domain/duration'
import type { Plan } from '@/domain/types'
import { formatWeight } from '@/domain/units'
import { ExerciseThumb } from '@/features/exercises/components/ExerciseThumb'
import { useExerciseLookup } from '@/features/exercises/hooks/useExerciseLookup'
import { PlanBadge } from '@/features/plans/components/PlanBadge'
import { startWorkout } from '@/features/workout/workoutActions'
import { cn } from '@/ui/cn'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'
import { EmptyState } from '@/ui/components/EmptyState'
import { PageHeader } from '@/ui/components/PageHeader'
import { ACADEMY_BADGE, PROFESSOR_NOTE, validityText } from './strings'

/** Ficha da academia: só leitura. O aluno vê a prescrição e inicia o treino. */
export function AcademyPlanView({ plan, letter }: { plan: Plan; letter: string }) {
  const settings = useSettings()
  const lookup = useExerciseLookup()
  const navigate = useNavigate()
  const info = plan.academy
  const validity = info ? validityText(info.expiresOn, info.expired) : null

  // Abrir a ficha conta como "visto": o aviso de treino novo some.
  useEffect(() => {
    if (info?.isNew) void markProgramSeen(info.programId)
  }, [info?.isNew, info?.programId])

  const start = async () => {
    const session = await startWorkout(plan)
    if (session) navigate('/treino')
  }

  return (
    <>
      <PageHeader
        back="/fichas"
        title={plan.name}
        subtitle={plan.archivedAt ? 'Treino encerrado pela academia' : info?.programName}
      />
      <div className="px-4 pb-8">
        <Card className="mb-3 flex items-center gap-4 p-4">
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

        <div className="mb-5 space-y-1 px-1 text-sm text-fg-muted">
          <p className="flex items-center gap-2 font-semibold text-accent">
            <Building2 className="size-4" aria-hidden />
            {ACADEMY_BADGE}
            {info?.author && <span className="font-normal text-fg-muted">· por {info.author}</span>}
          </p>
          {validity && (
            <p className={cn('flex items-center gap-2', info?.expired && 'text-warning')}>
              <CalendarClock className="size-4" aria-hidden />
              {validity}
            </p>
          )}
          <p>Feito pelo seu instrutor: você registra as cargas no treino, mas não edita a ficha.</p>
        </div>

        {info?.programNotes && (
          <Card className="mb-5 p-4">
            <p className="text-sm font-semibold text-fg-muted">Recado do instrutor</p>
            <p className="mt-1 whitespace-pre-line">{info.programNotes}</p>
          </Card>
        )}

        {plan.exercises.length === 0 ? (
          <EmptyState
            icon={<Dumbbell className="size-8" />}
            title="Ficha vazia"
            description="Seu instrutor ainda não colocou exercícios nesta ficha."
          />
        ) : (
          <ol className="space-y-2">
            {plan.exercises.map((e, index) => (
              <li key={e.id}>
                <Card className="p-2">
                  <Link
                    to={`/exercicios/${e.exercise.source}/${encodeURIComponent(e.exercise.id)}`}
                    className="flex min-h-touch items-center gap-3 rounded-control p-1 active:opacity-70"
                  >
                    <ExerciseThumb exRef={e.exercise} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-fg-subtle">
                        {index + 1}
                      </span>
                      <span className="block truncate font-semibold">
                        {lookup.name(e.exercise)}
                      </span>
                      <span className="block text-sm text-fg-muted tabular">
                        {e.sets} × {e.repMin === e.repMax ? e.repMin : `${e.repMin}–${e.repMax}`}
                        {e.loadKg > 0 && ` · ${formatWeight(e.loadKg, settings.weightUnit)}`} ·{' '}
                        {formatClock(e.restSec)}
                      </span>
                    </span>
                  </Link>
                  {e.notes && (
                    <div className="mx-1 mt-1 mb-1 flex gap-2 rounded-control bg-accent-soft px-3 py-2 text-sm">
                      <MessageSquareText
                        className="mt-0.5 size-4 shrink-0 text-accent"
                        aria-hidden
                      />
                      <p>
                        <span className="font-semibold">{PROFESSOR_NOTE}: </span>
                        {e.notes}
                      </p>
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  )
}
