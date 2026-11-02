import { AlertTriangle, ChevronRight, Flame, Scale, TrendingUp, Trophy } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { useCompletedSessions, useSettings } from '@/data/hooks'
import { addDays, sessionsByDay, startOfWeek, weekStreak } from '@/domain/calendar'
import { neglectedMuscleGroups, workByMuscleGroup, workoutsPerWeek } from '@/domain/stats'
import type { MuscleLookup } from '@/domain/stats'
import { formatNumber, formatVolume } from '@/domain/units'
import { useExerciseLookup } from '@/features/exercises/hooks/useExerciseLookup'
import { ColumnChart } from '@/ui/charts/ColumnChart'
import { HorizontalBars } from '@/ui/charts/HorizontalBars'
import { Card } from '@/ui/components/Card'
import { EmptyState } from '@/ui/components/EmptyState'
import { PageHeader } from '@/ui/components/PageHeader'
import { PageSpinner } from '@/ui/components/Spinner'
import { WorkoutCalendar } from './components/WorkoutCalendar'
import { shortDate } from './format'

const WEEKS = 12

function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-bold">{children}</h2>
      {hint && <p className="text-sm text-fg-muted">{hint}</p>}
    </div>
  )
}

function LinkCard({
  to,
  icon,
  title,
  subtitle,
}: {
  to: string
  icon: ReactNode
  title: string
  subtitle: string
}) {
  return (
    <Link
      to={to}
      className="flex min-h-18 items-center gap-3 rounded-card bg-surface p-4 shadow-card active:bg-surface-2"
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent"
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        <span className="block text-sm text-fg-muted">{subtitle}</span>
      </span>
      <ChevronRight className="size-5 text-fg-subtle" aria-hidden />
    </Link>
  )
}

export function ProgressPage() {
  const sessions = useCompletedSessions()
  const lookup = useExerciseLookup()
  const { weightUnit: unit } = useSettings()

  const data = useMemo(() => {
    if (!sessions || !lookup.ready) return null
    const now = new Date()
    const muscleOf: MuscleLookup = (ref) => {
      const ex = lookup.get(ref)
      return ex ? { primary: ex.primaryMuscles, secondary: ex.secondaryMuscles } : undefined
    }
    const weekStart = startOfWeek(now)
    return {
      streak: weekStreak(sessions, now),
      byDay: sessionsByDay(sessions),
      weeks: workoutsPerWeek(sessions, WEEKS, now),
      muscles: workByMuscleGroup(sessions, muscleOf, weekStart, addDays(weekStart, 7)),
      neglected: neglectedMuscleGroups(sessions, muscleOf, now),
    }
  }, [sessions, lookup])

  if (!data || !sessions) return <PageSpinner />

  const links = (
    <div className="grid gap-3">
      <LinkCard
        to="/progresso/recordes"
        icon={<Trophy className="size-5" />}
        title="Recordes pessoais"
        subtitle="Maior carga, 1RM e volume de cada exercício"
      />
      <LinkCard
        to="/progresso/corpo"
        icon={<Scale className="size-5" />}
        title="Peso e medidas"
        subtitle="Acompanhe seu corpo ao longo do tempo"
      />
    </div>
  )

  if (sessions.length === 0) {
    return (
      <>
        <PageHeader title="Progresso" />
        <EmptyState
          icon={<TrendingUp className="size-8" />}
          title="Nenhum treino concluído ainda"
          description="Conclua seu primeiro treino para ver calendário, sequência e estatísticas."
        />
        <div className="px-4">{links}</div>
      </>
    )
  }

  const { streak, byDay, weeks, muscles, neglected } = data
  const avg = weeks.slice(0, -1).reduce((n, w) => n + w.count, 0) / (WEEKS - 1)

  return (
    <>
      <PageHeader title="Progresso" />
      <div className="space-y-8 px-4 pb-8">
        <Card className="flex items-center gap-4 p-5">
          <span
            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning"
            aria-hidden
          >
            <Flame className="size-9" />
          </span>
          <div className="min-w-0">
            <p className="text-5xl leading-none font-extrabold tracking-tight">{streak.current}</p>
            <p className="mt-1 font-semibold">
              {streak.current === 1 ? 'semana ativa seguida' : 'semanas ativas seguidas'}
            </p>
            <p className="text-sm text-fg-muted">
              {streak.current > 0 && !streak.thisWeekActive
                ? 'Treine esta semana para manter a sequência. '
                : ''}
              Recorde: {streak.best} {streak.best === 1 ? 'semana' : 'semanas'}
            </p>
          </div>
        </Card>

        <section aria-labelledby="cal-title">
          <h2 id="cal-title" className="sr-only">
            Calendário de treinos
          </h2>
          <Card className="p-3">
            <WorkoutCalendar byDay={byDay} />
          </Card>
        </section>

        <section>
          <SectionTitle
            hint={`Últimas ${WEEKS} semanas · média de ${formatNumber(avg, 1)} por semana`}
          >
            Treinos por semana
          </SectionTitle>
          <Card className="p-4">
            <ColumnChart
              label={`Treinos por semana nas últimas ${WEEKS} semanas. Esta semana: ${weeks.at(-1)!.count}. Média: ${formatNumber(avg, 1)}.`}
              formatValue={(v) => (v === 1 ? '1 treino' : `${v} treinos`)}
              data={weeks.map((w, i) => ({
                key: String(w.weekStart.getTime()),
                label: i === weeks.length - 1 ? 'Atual' : shortDate.format(w.weekStart),
                value: w.count,
                highlight: i === weeks.length - 1,
                tooltipTitle:
                  i === weeks.length - 1
                    ? 'Esta semana'
                    : `Semana de ${shortDate.format(w.weekStart)}`,
              }))}
            />
          </Card>
        </section>

        <section>
          <SectionTitle hint="Séries de trabalho desde segunda. Músculos auxiliares contam meia série.">
            Esta semana por grupo muscular
          </SectionTitle>
          <Card className="p-4">
            {muscles.length === 0 ? (
              <p className="text-fg-muted">Nenhum treino nesta semana ainda.</p>
            ) : (
              <HorizontalBars
                label="Séries por grupo muscular nesta semana"
                data={muscles.map((m) => ({
                  key: m.group,
                  label: m.label,
                  value: m.sets,
                  valueLabel: `${formatNumber(m.sets, 1)} ${m.sets === 1 ? 'série' : 'séries'}`,
                  detail: `volume ${formatVolume(m.volumeKg, unit)}`,
                }))}
              />
            )}
          </Card>
        </section>

        {neglected.length > 0 && (
          <section>
            <SectionTitle hint="Grupos principais sem séries nos últimos 14 dias.">
              Grupos negligenciados
            </SectionTitle>
            <Card className="p-4">
              <ul className="flex flex-wrap gap-2">
                {neglected.map((g) => (
                  <li
                    key={g.group}
                    className="flex min-h-10 items-center gap-1.5 rounded-full bg-warning-soft px-3 text-sm font-semibold"
                  >
                    <AlertTriangle className="size-4 text-warning" aria-hidden />
                    {g.label}
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        {links}
      </div>
    </>
  )
}
