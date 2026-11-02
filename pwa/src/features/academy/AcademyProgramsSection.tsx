import { Building2, CalendarClock, ChevronRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { activeAcademyPrograms } from '@/domain/academy'
import type { Plan } from '@/domain/types'
import { PlanBadge } from '@/features/plans/components/PlanBadge'
import { cn } from '@/ui/cn'
import { Card } from '@/ui/components/Card'
import { ACADEMY_BADGE, validityText } from './strings'

/** Fichas recebidas da academia, agrupadas por treino. Sem editar, reordenar nem arquivar. */
export function AcademyProgramsSection({
  plans,
  letters,
}: {
  plans: readonly Plan[]
  letters: ReadonlyMap<string, string>
}) {
  const programs = activeAcademyPrograms(plans)
  if (programs.length === 0) return null

  return (
    <section aria-labelledby="academy-title" className="mb-8 space-y-4">
      <h2
        id="academy-title"
        className="flex items-center gap-2 text-sm font-semibold tracking-wide text-fg-muted uppercase"
      >
        <Building2 className="size-4" aria-hidden />
        {ACADEMY_BADGE}
      </h2>
      {programs.map(({ programId, plans: programPlans, info }) => {
        const validity = validityText(info.expiresOn, info.expired)
        return (
          <Card key={programId} className="overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <p className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-lg font-bold">
                  {info.programName}
                </span>
                {info.isNew && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-fg">
                    <Sparkles className="size-3.5" aria-hidden />
                    Novo
                  </span>
                )}
              </p>
              <p className="text-sm text-fg-muted">
                {info.author ? `Por ${info.author}` : 'Montado pela sua academia'}
              </p>
              {validity && (
                <p
                  className={cn(
                    'mt-1 flex items-center gap-1.5 text-sm',
                    info.expired ? 'font-semibold text-warning' : 'text-fg-muted',
                  )}
                >
                  <CalendarClock className="size-4" aria-hidden />
                  {validity}
                </p>
              )}
            </div>
            <ul className="divide-y divide-border">
              {programPlans.map((plan) => (
                <li key={plan.id}>
                  <Link
                    to={`/fichas/${plan.id}`}
                    className="flex min-h-16 items-center gap-3 px-4 py-2 active:bg-surface-2"
                  >
                    <PlanBadge letter={letters.get(plan.id) ?? '?'} color={plan.color} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{plan.name}</span>
                      <span className="block text-sm text-fg-muted">
                        {plan.exercises.length === 1
                          ? '1 exercício'
                          : `${plan.exercises.length} exercícios`}
                      </span>
                    </span>
                    <ChevronRight className="size-5 text-fg-subtle" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )
      })}
    </section>
  )
}
