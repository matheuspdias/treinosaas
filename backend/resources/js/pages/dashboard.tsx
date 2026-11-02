import { Link, router, usePage } from '@inertiajs/react'
import { CalendarClock, ChevronRight, Dumbbell, UserPlus, Users, UserX } from 'lucide-react'
import { PanelLayout } from '@/layouts/PanelLayout'
import { formatDateShort, relativeDays, validityLabel } from '@/lib/format'
import { useCan } from '@/lib/useCan'
import type { SharedData } from '@/types'
import { ColumnChart } from '@/ui/charts/ColumnChart'
import { Avatar } from '@/ui/components/Avatar'
import { Badge } from '@/ui/components/Badge'
import { buttonClass } from '@/ui/components/buttonClass'
import { Card } from '@/ui/components/Card'
import { Chip } from '@/ui/components/Chip'
import { EmptyState } from '@/ui/components/EmptyState'
import { PageHeader } from '@/ui/components/PageHeader'
import { StatCard } from '@/ui/components/StatCard'

interface Props {
  stats: { activeStudents: number; workoutsThisWeek: number; expiredPrograms: number }
  daily: { day: string; total: number }[]
  expiring: {
    id: string
    name: string
    expiresOn: string
    expired: boolean
    student: { id: string; name: string }
  }[]
  missingDays: number
  missing: { id: string; name: string; lastWorkoutAt: string | null }[]
}

const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })

export default function Dashboard({ stats, daily, expiring, missingDays, missing }: Props) {
  const { auth, academy } = usePage<SharedData>().props
  const can = useCan()
  const firstName = auth.user?.name.split(' ')[0]
  const today = daily.at(-1)?.day

  return (
    <PanelLayout title="Início">
      <PageHeader
        title={`Olá, ${firstName}`}
        subtitle={academy?.name}
        actions={
          can('students.manage') && (
            <Link href="/alunos/novo" className={buttonClass({ size: 'md' })}>
              <UserPlus className="size-5" />
              <span className="hidden sm:inline">Novo aluno</span>
            </Link>
          )
        }
      />

      <div className="flex flex-col gap-4 px-4 pt-2 lg:px-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatCard
            label="Alunos ativos"
            value={stats.activeStudents}
            icon={<Users className="size-5" />}
          />
          <StatCard
            label="Treinos na semana"
            value={stats.workoutsThisWeek}
            icon={<Dumbbell className="size-5" />}
          />
          <StatCard
            label="Fichas vencidas"
            value={stats.expiredPrograms}
            icon={<CalendarClock className="size-5" />}
            tone={stats.expiredPrograms > 0 ? 'warning' : 'neutral'}
          />
        </div>

        {stats.activeStudents === 0 && can('students.manage') ? (
          <Card>
            <EmptyState
              icon={<Users className="size-8" />}
              title="Cadastre o primeiro aluno"
              description="Com nome e celular. Ele entra no app pelo celular e cria um PIN na hora."
              action={
                <Link href="/alunos/novo" className={buttonClass({ block: true })}>
                  Cadastrar aluno
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5 lg:col-span-2">
              <h2 className="font-bold">Treinos por dia</h2>
              <p className="mb-3 text-sm text-fg-muted">Últimas 2 semanas</p>
              <ColumnChart
                label="Treinos realizados por dia nas últimas duas semanas"
                formatValue={(v) => `${v} ${v === 1 ? 'treino' : 'treinos'}`}
                data={daily.map((d) => ({
                  key: d.day,
                  label: weekday.format(new Date(`${d.day}T12:00:00`)).replace('.', ''),
                  value: d.total,
                  tooltipTitle: formatDateShort(d.day),
                  highlight: d.day === today,
                }))}
              />
            </Card>

            <Card className="p-5">
              <div className="mb-1 flex items-center gap-2">
                <CalendarClock className="size-5 text-warning" />
                <h2 className="font-bold">Fichas vencendo</h2>
              </div>
              <p className="mb-3 text-sm text-fg-muted">Vencidas e as que vencem em até 7 dias</p>
              {expiring.length === 0 ? (
                <p className="py-6 text-center text-fg-muted">Nenhuma ficha vencendo. 👌</p>
              ) : (
                <ul className="-mx-2 flex flex-col">
                  {expiring.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/alunos/${p.student.id}`}
                        className="flex min-h-touch items-center gap-3 rounded-control px-2 py-2 active:bg-surface-2 lg:hover:bg-surface-2"
                      >
                        <Avatar name={p.student.name} className="size-9 text-xs" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{p.student.name}</p>
                          <p className="truncate text-sm text-fg-muted">{p.name}</p>
                        </div>
                        <Badge tone={p.expired ? 'danger' : 'warning'}>
                          {validityLabel(p.expiresOn)}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <div className="mb-1 flex items-center gap-2">
                <UserX className="size-5 text-danger" />
                <h2 className="font-bold">Alunos sumidos</h2>
              </div>
              <p className="mb-3 text-sm text-fg-muted">
                Ativos sem treinar há mais de {missingDays} dias
              </p>
              <div className="mb-3 flex gap-2" role="group" aria-label="Período">
                {[7, 14, 30].map((d) => (
                  <Chip
                    key={d}
                    selected={d === missingDays}
                    onClick={() =>
                      router.get(
                        '/dashboard',
                        { sumidos: d },
                        { preserveScroll: true, preserveState: true },
                      )
                    }
                  >
                    {d} dias
                  </Chip>
                ))}
              </div>
              {missing.length === 0 ? (
                <p className="py-6 text-center text-fg-muted">Todo mundo treinando. 💪</p>
              ) : (
                <ul className="-mx-2 flex flex-col">
                  {missing.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/alunos/${s.id}`}
                        className="flex min-h-touch items-center gap-3 rounded-control px-2 py-2 active:bg-surface-2 lg:hover:bg-surface-2"
                      >
                        <Avatar name={s.name} className="size-9 text-xs" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{s.name}</p>
                          <p className="text-sm text-fg-muted">
                            Último treino: {relativeDays(s.lastWorkoutAt, 'nunca treinou pelo app')}
                          </p>
                        </div>
                        <ChevronRight className="size-5 text-fg-subtle" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </div>
    </PanelLayout>
  )
}
