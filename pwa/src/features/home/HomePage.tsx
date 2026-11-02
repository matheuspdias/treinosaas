import { ChevronRight, ClipboardList, Dumbbell, Play, Plus, Timer } from 'lucide-react'
import { useMemo } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import {
  useActiveSession,
  useCompletedSessions,
  usePlans,
  useSettings,
  useSettingsState,
} from '@/data/hooks'
import { formatRelativeDay, greeting } from '@/domain/dates'
import { formatDurationLong, sessionDurationSec } from '@/domain/duration'
import { nextSuggestedPlan, orderedActivePlans } from '@/domain/academy'
import type { Plan } from '@/domain/types'
import { formatVolume } from '@/domain/units'
import { sessionVolume } from '@/domain/volume'
import { AcademyHomeCards } from '@/features/academy/AcademyHomeCards'
import { useExerciseNames } from '@/features/exercises/hooks/useExerciseNames'
import { PlanBadge } from '@/features/plans/components/PlanBadge'
import { createNextPlan } from '@/features/plans/planActions'
import { planLetters } from '@/features/plans/planLetters'
import { useElapsed } from '@/features/workout/useElapsed'
import { startWorkout } from '@/features/workout/workoutActions'
import { cn } from '@/ui/cn'
import { Button } from '@/ui/components/Button'
import { buttonClass } from '@/ui/components/buttonClass'
import { Card } from '@/ui/components/Card'
import { EmptyState } from '@/ui/components/EmptyState'
import { IconButton } from '@/ui/components/IconButton'
import { PageSpinner } from '@/ui/components/Spinner'
import { PLAN_COLOR_CLASS } from '@/ui/theme/planColors'

const todayFmt = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const shortFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

export function HomePage() {
  const plans = usePlans()
  const history = useCompletedSessions()
  const active = useActiveSession()
  const { weightUnit } = useSettings()
  const settingsState = useSettingsState()
  const exerciseName = useExerciseNames()
  const navigate = useNavigate()
  const elapsed = useElapsed(active?.startedAt)

  const view = useMemo(() => {
    if (!plans || !history) return null
    // Sem academia: mesma sequência de sempre. Com treino da academia, segue as fichas dela.
    const next = nextSuggestedPlan(plans, history)
    const lastByPlan = new Map<string, string>()
    for (const s of history) if (!lastByPlan.has(s.planId)) lastByPlan.set(s.planId, s.startedAt)
    return {
      next,
      all: orderedActivePlans(plans),
      others: orderedActivePlans(plans).filter((p) => p.id !== next?.id),
      letters: planLetters(plans),
      lastByPlan,
    }
  }, [plans, history])

  if (!view || active === undefined || !history || !settingsState) return <PageSpinner />
  // Primeira abertura (sem nenhum dado): boas-vindas com modelos prontos.
  if (!settingsState.onboardingDone && plans?.length === 0 && history.length === 0 && !active) {
    return <Navigate to="/boas-vindas" replace />
  }

  const start = async (plan: Plan) => {
    const session = await startWorkout(plan)
    if (session) navigate('/treino')
  }

  const { next, all, others, letters, lastByPlan } = view
  const recent = history.slice(0, 3)

  return (
    <div className="px-4 pt-6 safe-top">
      <header className="mb-6">
        <p className="text-sm font-medium text-fg-muted first-letter:uppercase">
          {todayFmt.format(new Date())}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">{greeting()}!</h1>
      </header>

      <AcademyHomeCards plans={plans ?? []} history={history} />

      {active && (
        <Link
          to="/treino"
          className="mb-6 block rounded-card bg-accent p-5 text-accent-fg shadow-sheet active:brightness-95"
        >
          <p className="flex items-center gap-2 text-sm font-semibold opacity-80">
            <span className="size-2.5 animate-pulse rounded-full bg-accent-fg" aria-hidden />
            Treino em andamento
          </p>
          <p className="mt-1 text-2xl font-extrabold">{active.planName}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-lg font-bold tabular">
              <Timer className="size-5" aria-hidden />
              {elapsed}
            </span>
            <span className="flex min-h-touch items-center gap-1 rounded-control bg-accent-fg/15 px-4 font-bold">
              Continuar
              <ChevronRight className="size-5" aria-hidden />
            </span>
          </div>
        </Link>
      )}

      {!next ? (
        <EmptyState
          icon={<ClipboardList className="size-8" />}
          title="Monte sua primeira ficha"
          description="Crie o Treino A com seus exercícios, séries e cargas. O app sugere o próximo treino da sequência automaticamente."
          action={
            <Button
              size="lg"
              block
              icon={<Plus className="size-5" />}
              onClick={async () => {
                const plan = await createNextPlan()
                navigate(`/fichas/${plan.id}`)
              }}
            >
              Criar ficha
            </Button>
          }
        />
      ) : (
        <>
          {!active && (
            <section aria-labelledby="next-title" className="mb-8">
              <h2
                id="next-title"
                className="mb-3 text-sm font-semibold tracking-wide text-fg-muted uppercase"
              >
                Próximo treino
              </h2>
              <Card className="relative overflow-hidden p-5">
                <span
                  className={cn('absolute inset-y-0 left-0 w-1.5', PLAN_COLOR_CLASS[next.color].bg)}
                  aria-hidden
                />
                <div className="flex items-center gap-4">
                  <PlanBadge letter={letters.get(next.id) ?? ''} color={next.color} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-2xl font-extrabold tracking-tight">{next.name}</p>
                    <p className="text-sm text-fg-muted">
                      {next.exercises.length}{' '}
                      {next.exercises.length === 1 ? 'exercício' : 'exercícios'}
                      {lastByPlan.has(next.id) &&
                        ` · feito ${formatRelativeDay(lastByPlan.get(next.id)!)}`}
                    </p>
                  </div>
                </div>
                {next.exercises.length > 0 ? (
                  <>
                    <ul className="mt-4 space-y-1 text-fg-muted">
                      {next.exercises.slice(0, 4).map((e) => (
                        <li key={e.id} className="flex items-center gap-2 truncate">
                          <Dumbbell className="size-4 shrink-0 text-fg-subtle" aria-hidden />
                          <span className="truncate">{exerciseName(e.exercise)}</span>
                        </li>
                      ))}
                      {next.exercises.length > 4 && (
                        <li className="pl-6 text-sm text-fg-subtle">
                          + {next.exercises.length - 4} exercícios
                        </li>
                      )}
                    </ul>
                    <Button
                      size="lg"
                      block
                      className="mt-5"
                      icon={<Play className="size-5 fill-current" />}
                      onClick={() => void start(next)}
                    >
                      Iniciar treino
                    </Button>
                  </>
                ) : (
                  <Link
                    to={`/fichas/${next.id}`}
                    className={cn(
                      buttonClass({ variant: 'secondary', block: true, size: 'lg' }),
                      'mt-5',
                    )}
                  >
                    Adicionar exercícios
                  </Link>
                )}
              </Card>
            </section>
          )}

          {others.length > 0 && (
            <section aria-labelledby="others-title" className="mb-8">
              <h2
                id="others-title"
                className="mb-3 text-sm font-semibold tracking-wide text-fg-muted uppercase"
              >
                {active ? 'Fichas' : 'Ou escolha outra ficha'}
              </h2>
              <ul className="space-y-2">
                {(active ? all : others).map((p) => (
                  <li key={p.id}>
                    <Card className="flex items-center gap-3 py-2 pr-2 pl-3">
                      <PlanBadge letter={letters.get(p.id) ?? ''} color={p.color} />
                      <Link to={`/fichas/${p.id}`} className="min-w-0 flex-1 py-2">
                        <span className="block truncate font-semibold">{p.name}</span>
                        <span className="block text-sm text-fg-muted">
                          {lastByPlan.has(p.id)
                            ? `Feito ${formatRelativeDay(lastByPlan.get(p.id)!)}`
                            : 'Ainda não feito'}
                        </span>
                      </Link>
                      {!active && p.exercises.length > 0 && (
                        <IconButton
                          label={`Iniciar ${p.name}`}
                          variant="secondary"
                          icon={<Play className="size-5 fill-current" />}
                          onClick={() => void start(p)}
                        />
                      )}
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {recent.length > 0 && (
        <section aria-labelledby="recent-title" className="mb-8">
          <h2
            id="recent-title"
            className="mb-3 text-sm font-semibold tracking-wide text-fg-muted uppercase"
          >
            Últimos treinos
          </h2>
          <Card>
            <ul className="divide-y divide-border">
              {recent.map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/treino/${s.id}/resumo`}
                    className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-surface-2"
                  >
                    <span
                      className={cn(
                        'size-2.5 shrink-0 rounded-full',
                        PLAN_COLOR_CLASS[s.planColor].bg,
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{s.planName}</span>
                      <span className="block text-sm text-fg-muted tabular">
                        {shortFmt.format(new Date(s.startedAt))} ·{' '}
                        {formatDurationLong(sessionDurationSec(s))} ·{' '}
                        {formatVolume(sessionVolume(s), weightUnit)}
                      </span>
                    </span>
                    <ChevronRight className="size-5 text-fg-subtle" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  )
}
