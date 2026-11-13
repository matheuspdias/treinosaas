import { Link } from '@inertiajs/react'
import { Plus } from 'lucide-react'
import type { AdminAcademy, FounderSpots } from '@/features/admin/types'
import { PanelLayout } from '@/layouts/PanelLayout'
import { formatDate } from '@/lib/format'
import { Badge } from '@/ui/components/Badge'
import { buttonClass } from '@/ui/components/buttonClass'
import { Card } from '@/ui/components/Card'
import { EmptyState } from '@/ui/components/EmptyState'
import { PageHeader } from '@/ui/components/PageHeader'

export default function AdminAcademies({
  academies,
  founders,
}: {
  academies: AdminAcademy[]
  founders: FounderSpots
}) {
  return (
    <PanelLayout title="Academias" width="narrow">
      <PageHeader
        title="Academias"
        subtitle={`Fundadores: ${founders.taken} de ${founders.total} vagas ocupadas`}
        actions={
          <Link href="/admin/academias/nova" className={buttonClass({ variant: 'primary' })}>
            <Plus className="size-5" /> Nova
          </Link>
        }
      />
      <div className="flex flex-col gap-2 px-4 pt-2 lg:px-6">
        {academies.length === 0 ? (
          <EmptyState
            title="Nenhuma academia ainda"
            description="Crie a primeira pelo botão Nova."
          />
        ) : (
          academies.map((a) => (
            <Link key={a.id} href={`/admin/academias/${a.id}/editar`}>
              <Card className="flex items-center gap-3 p-4 active:bg-surface-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{a.name}</p>
                  <p className="text-sm text-fg-muted">
                    {a.planName} · {a.activeStudents}{' '}
                    {a.activeStudents === 1 ? 'aluno ativo' : 'alunos ativos'} · {a.amountLabel}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {a.isFounder && <Badge tone="accent">Fundadora</Badge>}
                    {a.billingCycle === 'yearly' && <Badge>Anual</Badge>}
                    {a.inTrial && a.trialEndsAt && (
                      <Badge>Teste até {formatDate(a.trialEndsAt)}</Badge>
                    )}
                    {a.overLimit && <Badge tone="warning">Acima do limite da faixa</Badge>}
                    {a.suspended && <Badge tone="danger">Suspensa</Badge>}
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </PanelLayout>
  )
}
