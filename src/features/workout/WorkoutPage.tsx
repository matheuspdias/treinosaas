import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Flame,
  History,
  ListOrdered,
  Plus,
  StickyNote,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useCompletedSessions, useSettings } from '@/data/hooks'
import { formatClock } from '@/domain/duration'
import {
  computeBests,
  exerciseKey,
  mergeBests,
  RECORD_LABEL,
  setRecordTypes,
} from '@/domain/records'
import {
  acceptProgression,
  addSet,
  adjustRest,
  dismissProgression,
  findLastPerformance,
  goToExercise,
  hasAnyCompletedSet,
  removeSet,
  setRest,
  toggleSetDone,
  updateSet,
} from '@/domain/session'
import type { Session, SessionExercise, SetLog } from '@/domain/types'
import { formatWeight } from '@/domain/units'
import { isWorkSet } from '@/domain/volume'
import { ExerciseMediaView } from '@/features/exercises/components/ExerciseMediaView'
import { notificationPermission, requestNotificationPermission } from '@/lib/notifications'
import { unlockAudio } from '@/lib/sound'
import { TAP_VIBRATION, vibrate } from '@/lib/vibrate'
import { useWakeLock } from '@/lib/wakeLock'
import { confirm } from '@/stores/confirmStore'
import { toast } from '@/stores/toastStore'
import { cn } from '@/ui/cn'
import { Button } from '@/ui/components/Button'
import { buttonClass } from '@/ui/components/buttonClass'
import { EmptyState } from '@/ui/components/EmptyState'
import { IconButton } from '@/ui/components/IconButton'
import { PageSpinner } from '@/ui/components/Spinner'
import { PLAN_COLOR_CLASS } from '@/ui/theme/planColors'
import { ExerciseListSheet } from './components/ExerciseListSheet'
import { ProgressionCard } from './components/ProgressionCard'
import { RestPanel } from './components/RestPanel'
import { SET_GRID, SetRow } from './components/SetRow'
import { SetMenuSheet } from './components/SetMenuSheet'
import { useElapsed } from './useElapsed'
import { useRestAlerts } from './useRestAlerts'
import { completeWorkout, discardWorkout } from './workoutActions'
import { flushWorkoutWrites, useWorkoutStore } from './workoutStore'

function setLabels(sets: SetLog[]): string[] {
  let n = 0
  return sets.map((s) => (s.isWarmup ? 'A' : String(++n)))
}

function repRange(e: SessionExercise): string {
  const { repMin, repMax } = e.target
  return repMin === repMax ? `${repMin}` : `${repMin}–${repMax}`
}

export function WorkoutPage() {
  const { session, status, load, apply, clear } = useWorkoutStore()
  const settings = useSettings()
  const history = useCompletedSessions()
  const navigate = useNavigate()
  const elapsed = useElapsed(session?.startedAt)
  const [listOpen, setListOpen] = useState(false)
  const [menuSetId, setMenuSetId] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [load])

  useWakeLock(!!session)
  const stableApply = useCallback((fn: (s: Session) => Session) => apply(fn), [apply])
  useRestAlerts(session, settings, stableApply)

  const exercise = session?.exercises[session.currentExerciseIndex]
  const last = useMemo(
    () => (exercise && history ? findLastPerformance(history, exercise.exercise) : undefined),
    [exercise, history],
  )
  const historyBests = useMemo(() => (history ? computeBests(history) : undefined), [history])

  if (status !== 'ready') return <PageSpinner />
  if (!session || !exercise) {
    return (
      <div className="pt-16">
        <EmptyState
          icon={<Flag className="size-8" />}
          title="Nenhum treino em andamento"
          description="Escolha uma ficha na tela inicial para começar."
          action={
            <Link to="/" className={buttonClass({ block: true, size: 'lg' })}>
              Ir para o início
            </Link>
          }
        />
      </div>
    )
  }

  const index = session.currentExerciseIndex
  const isLast = index === session.exercises.length - 1
  const labels = setLabels(exercise.sets)
  const lastWarmups = last?.sets.filter((s) => s.isWarmup && s.completedAt) ?? []
  const lastWork = last?.sets.filter(isWorkSet) ?? []
  const workDone = exercise.sets.filter((s) => !s.isWarmup && s.completedAt).length
  const workTotal = exercise.sets.filter((s) => !s.isWarmup).length
  const exerciseComplete = workTotal > 0 && workDone === workTotal
  const menuSet = exercise.sets.find((s) => s.id === menuSetId) ?? null
  const menuLabel = menuSet ? (labels[exercise.sets.indexOf(menuSet)] ?? '') : ''

  const exBests = historyBests?.get(exerciseKey(exercise.exercise))

  const previousFor = (set: SetLog, i: number): SetLog | undefined => {
    const pos = labels.slice(0, i).filter((l) => (set.isWarmup ? l === 'A' : l !== 'A')).length
    return set.isWarmup ? lastWarmups[pos] : lastWork[pos]
  }

  const onToggleDone = (set: SetLog) => {
    unlockAudio()
    if (!set.completedAt) {
      // Recorde contra o histórico e contra as séries já feitas hoje (avisa só quando supera de novo).
      const doneToday = computeBests([
        {
          ...session,
          exercises: [
            { ...exercise, sets: exercise.sets.filter((s) => s.id !== set.id && s.completedAt) },
          ],
        },
      ]).get(exerciseKey(exercise.exercise))
      const types = exBests
        ? setRecordTypes(
            { ...set, completedAt: new Date().toISOString() },
            mergeBests(exBests, doneToday),
          )
        : []
      if (types.length > 0) {
        vibrate([60, 40, 60, 40, 140])
        toast(`Novo recorde! ${types.map((t) => RECORD_LABEL[t]).join(' · ')}`, {
          tone: 'success',
          duration: 5000,
        })
      } else vibrate(TAP_VIBRATION)
      if (settings.restNotification && notificationPermission() === 'default')
        void requestNotificationPermission()
    }
    apply((s) => toggleSetDone(s, exercise.id, set.id))
  }

  const finish = async () => {
    await flushWorkoutWrites()
    const current = useWorkoutStore.getState().session
    if (!current) return
    if (!hasAnyCompletedSet(current)) {
      const ok = await confirm({
        title: 'Nenhuma série concluída',
        description: 'Não há nada para registrar. Deseja descartar este treino?',
        confirmLabel: 'Descartar treino',
        tone: 'danger',
      })
      if (ok) await discard(true)
      return
    }
    const pending = current.exercises.reduce(
      (n, e) => n + e.sets.filter((s) => !s.completedAt && !s.isWarmup).length,
      0,
    )
    const ok = await confirm({
      title: 'Finalizar treino?',
      description:
        pending > 0
          ? `${pending} ${pending === 1 ? 'série não concluída não será registrada' : 'séries não concluídas não serão registradas'}.`
          : 'Todas as séries foram concluídas. Bom trabalho!',
      confirmLabel: 'Finalizar',
    })
    if (!ok) return
    const done = await completeWorkout(useWorkoutStore.getState().session ?? current)
    clear()
    navigate(`/treino/${done.id}/resumo`, { replace: true })
  }

  const discard = async (skipConfirm = false) => {
    setListOpen(false)
    if (!skipConfirm) {
      const ok = await confirm({
        title: 'Descartar treino?',
        description: 'Tudo o que foi registrado neste treino será apagado.',
        confirmLabel: 'Descartar',
        tone: 'danger',
      })
      if (!ok) return
    }
    await flushWorkoutWrites()
    const current = useWorkoutStore.getState().session
    if (current) await discardWorkout(current)
    clear()
    toast('Treino descartado.')
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-20 bg-bg/95 safe-top backdrop-blur-md">
        <div className="flex min-h-16 items-center gap-1 px-2">
          <IconButton
            label="Sair do modo treino (o treino continua salvo)"
            icon={<ChevronLeft className="size-7" />}
            onClick={() => navigate('/')}
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 truncate text-sm font-semibold text-fg-muted">
              <span
                className={cn(
                  'size-2.5 shrink-0 rounded-full',
                  PLAN_COLOR_CLASS[session.planColor].bg,
                )}
                aria-hidden
              />
              {session.planName}
            </p>
            <p
              className="text-xl font-extrabold tabular"
              aria-label={`Duração do treino: ${elapsed}`}
            >
              {elapsed}
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setListOpen(true)}
            icon={<ListOrdered className="size-5" />}
            aria-label={`Exercício ${index + 1} de ${session.exercises.length}. Ver lista`}
          >
            <span className="tabular">
              {index + 1}/{session.exercises.length}
            </span>
          </Button>
          <Button onClick={() => void finish()} className="ml-1">
            Finalizar
          </Button>
        </div>
        <div className="flex gap-1 px-4 pb-2" aria-hidden>
          {session.exercises.map((e, i) => {
            const w = e.sets.filter((s) => !s.isWarmup)
            const complete = w.length > 0 && w.every((s) => s.completedAt)
            return (
              <span
                key={e.id}
                className={cn(
                  'h-1.5 flex-1 rounded-full',
                  i === index ? 'bg-fg' : complete ? 'bg-success' : 'bg-surface-3',
                )}
              />
            )
          })}
        </div>
      </header>

      {/* Exercício atual */}
      <div key={exercise.id} className="exercise-in flex-1 px-4 pt-2 pb-48">
        <ExerciseMediaView
          exRef={exercise.exercise}
          name={exercise.exerciseName}
          className="aspect-[16/10] max-h-[30dvh]"
        />

        <div className="mt-4 flex items-start gap-2">
          <h1 className="min-w-0 flex-1 text-2xl leading-tight font-extrabold tracking-tight">
            {exercise.exerciseName}
          </h1>
          <IconButton
            label={`Histórico de ${exercise.exerciseName}`}
            variant="secondary"
            icon={<History className="size-5" />}
            onClick={() =>
              navigate(
                `/exercicios/${exercise.exercise.source}/${encodeURIComponent(exercise.exercise.id)}/historico`,
              )
            }
          />
        </div>
        <p className="mt-1 text-fg-muted tabular">
          {workTotal} × {repRange(exercise)} reps · descanso {formatClock(exercise.target.restSec)}
        </p>

        {exercise.progression && (
          <ProgressionCard
            suggestion={exercise.progression}
            repMax={exercise.target.repMax}
            unit={settings.weightUnit}
            onAccept={() => apply((s) => acceptProgression(s, exercise.id))}
            onDismiss={() => apply((s) => dismissProgression(s, exercise.id))}
          />
        )}

        {exercise.notes && (
          <p className="mt-3 flex gap-2 rounded-control bg-warning-soft px-3 py-2.5 text-sm font-medium text-fg">
            <StickyNote className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            {exercise.notes}
          </p>
        )}

        <p className="mt-3 text-sm text-fg-muted">
          {lastWork.length > 0 ? (
            <>
              <span className="font-semibold text-fg">Última vez:</span>{' '}
              <span className="tabular">
                {lastWork
                  .map((s) => `${formatWeight(s.weightKg, settings.weightUnit, false)}×${s.reps}`)
                  .join(' · ')}
              </span>{' '}
              {settings.weightUnit}
            </>
          ) : (
            'Primeira vez com este exercício.'
          )}
        </p>

        {/* Séries */}
        <div className="mt-4" role="group" aria-label="Séries">
          <div
            className={cn(
              SET_GRID,
              'px-1 pb-1 text-center text-xs font-semibold tracking-wide text-fg-subtle uppercase',
            )}
            aria-hidden
          >
            <span>Série</span>
            <span>Anterior</span>
            <span>{settings.weightUnit}</span>
            <span>Reps</span>
            <span />
          </div>
          <div className="space-y-1">
            {exercise.sets.map((set, i) => (
              <SetRow
                key={set.id}
                set={set}
                label={labels[i] ?? ''}
                previous={previousFor(set, i)}
                unit={settings.weightUnit}
                onChange={(patch) => apply((s) => updateSet(s, exercise.id, set.id, patch))}
                onToggleDone={() => onToggleDone(set)}
                onOpenMenu={() => setMenuSetId(set.id)}
                record={setRecordTypes(set, exBests).length > 0}
              />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              icon={<Plus className="size-5" />}
              onClick={() => apply((s) => addSet(s, exercise.id, false))}
            >
              Série
            </Button>
            <Button
              variant="secondary"
              icon={<Flame className="size-5" />}
              onClick={() => apply((s) => addSet(s, exercise.id, true))}
            >
              Aquecimento
            </Button>
          </div>
        </div>
      </div>

      {/* Rodapé fixo: descanso + navegação (zona do polegar) */}
      <div className="fixed inset-x-0 bottom-0 z-30 safe-bottom">
        <div className="mx-auto max-w-2xl space-y-2 px-3 pb-3">
          {session.rest && (
            <RestPanel
              key={session.rest.endsAt}
              rest={session.rest}
              onAdjust={(d) => apply((s) => adjustRest(s, d))}
              onSkip={() => apply((s) => setRest(s, null))}
            />
          )}
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-card bg-surface/95 p-2 shadow-sheet backdrop-blur-md">
            <Button
              variant="secondary"
              size="lg"
              disabled={index === 0}
              onClick={() => apply((s) => goToExercise(s, index - 1))}
              aria-label="Exercício anterior"
              icon={<ChevronLeft className="size-6" />}
            />
            {isLast ? (
              <Button
                size="lg"
                variant={exerciseComplete ? 'primary' : 'secondary'}
                onClick={() => void finish()}
                icon={<Flag className="size-5" />}
              >
                Finalizar treino
              </Button>
            ) : (
              <Button
                size="lg"
                className="min-w-0"
                variant={exerciseComplete ? 'primary' : 'secondary'}
                onClick={() => apply((s) => goToExercise(s, index + 1))}
              >
                <span className="truncate">
                  Próximo: {session.exercises[index + 1]?.exerciseName}
                </span>
                <ChevronRight className="size-6 shrink-0" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <ExerciseListSheet
        session={session}
        open={listOpen}
        onClose={() => setListOpen(false)}
        onSelect={(i) => apply((s) => goToExercise(s, i))}
        onDiscard={() => void discard()}
      />
      <SetMenuSheet
        set={menuSet}
        label={menuLabel}
        onClose={() => setMenuSetId(null)}
        onToggleWarmup={() =>
          menuSet &&
          apply((s) => updateSet(s, exercise.id, menuSet.id, { isWarmup: !menuSet.isWarmup }))
        }
        onRemove={() => menuSet && apply((s) => removeSet(s, exercise.id, menuSet.id))}
      />
    </div>
  )
}
