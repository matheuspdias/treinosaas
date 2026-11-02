import { Link, router } from '@inertiajs/react'
import { ChevronRight, Search, UserPlus, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { AccessBadge } from '@/features/students/AccessBadge'
import { PanelLayout } from '@/layouts/PanelLayout'
import { relativeDays, validityLabel } from '@/lib/format'
import { useCan } from '@/lib/useCan'
import type { Paginated, StudentSummary } from '@/types'
import { cn } from '@/ui/cn'
import { Avatar } from '@/ui/components/Avatar'
import { Badge } from '@/ui/components/Badge'
import { buttonClass } from '@/ui/components/buttonClass'
import { Card } from '@/ui/components/Card'
import { EmptyState } from '@/ui/components/EmptyState'
import { inputClass } from '@/ui/components/Field'
import { PageHeader } from '@/ui/components/PageHeader'
import { Pagination } from '@/ui/components/Pagination'
import { SegmentedControl } from '@/ui/components/SegmentedControl'

type Situation = 'active' | 'inactive' | 'all'

interface Props {
  students: Paginated<StudentSummary>
  filters: { busca: string | null; situacao: Situation }
}

export default function StudentsIndex({ students, filters }: Props) {
  const can = useCan()
  const [search, setSearch] = useState(filters.busca ?? '')
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const t = setTimeout(() => {
      router.get(
        '/alunos',
        { busca: search || undefined, situacao: filters.situacao },
        { preserveState: true, replace: true, preserveScroll: true },
      )
    }, 300)
    return () => clearTimeout(t)
  }, [search, filters.situacao])

  const setSituation = (situacao: Situation) =>
    router.get(
      '/alunos',
      { busca: search || undefined, situacao },
      { preserveState: true, replace: true },
    )

  return (
    <PanelLayout title="Alunos">
      <PageHeader
        title="Alunos"
        subtitle={`${students.meta.total} ${students.meta.total === 1 ? 'aluno' : 'alunos'}`}
        actions={
          can('students.manage') && (
            <Link href="/alunos/novo" className={buttonClass()}>
              <UserPlus className="size-5" />
              <span className="hidden sm:inline">Novo aluno</span>
            </Link>
          )
        }
      />

      <div className="flex flex-col gap-3 px-4 pt-2 lg:flex-row lg:px-6">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-fg-subtle" />
          <input
            type="search"
            aria-label="Buscar por nome ou celular"
            placeholder="Buscar por nome ou celular"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(inputClass, 'pl-12')}
          />
        </div>
        <div className="lg:w-80">
          <SegmentedControl<Situation>
            label="Situação"
            value={filters.situacao}
            onChange={setSituation}
            options={[
              { value: 'active', label: 'Ativos' },
              { value: 'inactive', label: 'Inativos' },
              { value: 'all', label: 'Todos' },
            ]}
          />
        </div>
      </div>

      <div className="px-4 pt-4 lg:px-6">
        {students.data.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Users className="size-8" />}
              title={search ? 'Ninguém encontrado' : 'Nenhum aluno aqui'}
              description={search ? 'Confira o nome ou os últimos dígitos do celular.' : undefined}
            />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-border">
              {students.data.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/alunos/${s.id}`}
                    className="flex min-h-touch-lg items-center gap-3 px-4 py-3 active:bg-surface-2 lg:hover:bg-surface-2"
                  >
                    <Avatar name={s.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="truncate font-semibold">{s.name}</p>
                        {s.status === 'inactive' && <Badge>Inativo</Badge>}
                        {s.status === 'active' && <AccessBadge access={s.access} />}
                      </div>
                      <p className="truncate text-sm text-fg-muted">
                        {s.phoneMasked} · Último treino {relativeDays(s.lastWorkoutAt)}
                      </p>
                    </div>
                    <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                      {s.program ? (
                        <>
                          <span className="max-w-48 truncate text-sm font-semibold">
                            {s.program.name}
                          </span>
                          {s.program.expiresOn && (
                            <Badge tone={s.program.expired ? 'danger' : 'neutral'}>
                              {validityLabel(s.program.expiresOn)}
                            </Badge>
                          )}
                        </>
                      ) : (
                        s.status === 'active' && <Badge tone="warning">Sem treino</Badge>
                      )}
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-fg-subtle" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
        <Pagination meta={students.meta} links={students.links} />
      </div>
    </PanelLayout>
  )
}
