import { useForm } from '@inertiajs/react'
import type { FormEvent } from 'react'
import type {
  AdminAcademy,
  BillingCycle,
  FounderSpots,
  PlanTier,
  TierOption,
} from '@/features/admin/types'
import { PanelLayout } from '@/layouts/PanelLayout'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'
import { FieldError, SelectField, TextField } from '@/ui/components/Field'
import { SegmentedControl } from '@/ui/components/SegmentedControl'
import { Switch } from '@/ui/components/Switch'
import { PageHeader } from '@/ui/components/PageHeader'

const brl = (v: number) =>
  v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
  })

interface Props {
  target: AdminAcademy | null
  tiers: TierOption[]
  annualMonthsPaid: number
  founders: FounderSpots
  suggestedTrialEndsAt: string
}

export default function AdminAcademyForm({
  target: academy,
  tiers,
  annualMonthsPaid,
  founders,
  suggestedTrialEndsAt,
}: Props) {
  const editing = academy !== null
  const form = useForm({
    name: '',
    owner_email: '',
    owner_name: '',
    plan_tier: academy?.planTier ?? ('essencial' as PlanTier),
    billing_cycle: academy?.billingCycle ?? ('monthly' as BillingCycle),
    is_founder: academy?.isFounder ?? false,
    founder_since: academy?.founderSince ?? '',
    trial_ends_at: editing ? (academy.trialEndsAt ?? '') : suggestedTrialEndsAt,
  })

  const tier = tiers.find((t) => t.value === form.data.plan_tier)!
  const monthly = form.data.is_founder ? tier.founderMonthly : tier.monthly
  const price =
    form.data.billing_cycle === 'yearly'
      ? `${brl(monthly * annualMonthsPaid)}/ano (${annualMonthsPaid} meses)`
      : `${brl(monthly)}/mês`
  // Sem vaga, só dá para manter quem já é fundadora.
  const canBeFounder = founders.remaining > 0 || academy?.isFounder === true
  const suggested = academy ? tiers.find((t) => t.value === academy.suggestedTier) : null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (editing) form.put(`/admin/academias/${academy.id}`)
    else form.post('/admin/academias')
  }

  return (
    <PanelLayout title={editing ? academy.name : 'Nova academia'} width="narrow">
      <PageHeader
        title={editing ? academy.name : 'Nova academia'}
        subtitle={
          editing
            ? `${academy.slug} · ${academy.activeStudents} ${academy.activeStudents === 1 ? 'aluno ativo' : 'alunos ativos'}`
            : undefined
        }
        back="/admin/academias"
      />
      <form onSubmit={submit} className="flex flex-col gap-4 px-4 pt-2 lg:px-6">
        {!editing && (
          <Card className="flex flex-col gap-4 p-5">
            <TextField
              label="Nome da academia"
              required
              autoFocus
              value={form.data.name}
              onChange={(e) => form.setData('name', e.target.value)}
              error={form.errors.name}
            />
            <TextField
              label="E-mail do dono"
              type="email"
              required
              value={form.data.owner_email}
              onChange={(e) => form.setData('owner_email', e.target.value)}
              error={form.errors.owner_email}
              hint="Se ainda não tiver conta, criamos uma com senha provisória"
            />
            <TextField
              label="Nome do dono"
              value={form.data.owner_name}
              onChange={(e) => form.setData('owner_name', e.target.value)}
              error={form.errors.owner_name}
            />
          </Card>
        )}

        <Card className="flex flex-col gap-4 p-5">
          <SelectField
            label="Plano"
            value={form.data.plan_tier}
            onChange={(e) => form.setData('plan_tier', e.target.value as PlanTier)}
            error={form.errors.plan_tier}
          >
            {tiers.map((t) => (
              <option key={t.value} value={t.value}>
                {t.name} ({t.maxStudents === null ? 'sem limite' : `até ${t.maxStudents}`}) ·{' '}
                {brl(t.monthly)} · fundador {brl(t.founderMonthly)}
              </option>
            ))}
          </SelectField>
          {academy?.overLimit && suggested && (
            <p className="-mt-2 text-sm text-warning">
              {academy.activeStudents} alunos ativos: acima do limite desta faixa. Sugerido:{' '}
              {suggested.name}.
            </p>
          )}

          <div>
            <p className="mb-1.5 font-medium">Cobrança</p>
            <SegmentedControl
              label="Cobrança"
              value={form.data.billing_cycle}
              onChange={(v) => form.setData('billing_cycle', v)}
              options={[
                { value: 'monthly', label: 'Mensal' },
                { value: 'yearly', label: `Anual (paga ${annualMonthsPaid})` },
              ]}
            />
            <FieldError message={form.errors.billing_cycle} />
          </div>

          <div>
            <Switch
              label="Fundadora (45% de desconto)"
              description={`Vagas: ${founders.taken} de ${founders.total} ocupadas`}
              checked={form.data.is_founder}
              disabled={!canBeFounder}
              onChange={(v) => form.setData('is_founder', v)}
            />
            <FieldError message={form.errors.is_founder} />
          </div>
          {form.data.is_founder && (
            <TextField
              label="Fundadora desde"
              type="date"
              value={form.data.founder_since}
              onChange={(e) => form.setData('founder_since', e.target.value)}
              error={form.errors.founder_since}
              hint="Vazio: hoje"
            />
          )}

          <TextField
            label="Teste grátis até"
            type="date"
            value={form.data.trial_ends_at}
            onChange={(e) => form.setData('trial_ends_at', e.target.value)}
            error={form.errors.trial_ends_at}
          />

          <p className="rounded-control bg-surface-2 p-3 font-semibold">Valor: {price}</p>
        </Card>

        <Button type="submit" size="lg" disabled={form.processing} className="lg:self-start">
          {editing ? 'Salvar' : 'Criar academia'}
        </Button>
      </form>
    </PanelLayout>
  )
}
