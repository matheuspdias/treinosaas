import { router, useForm } from '@inertiajs/react'
import { Pencil, Plus, Ruler, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { formatDate, formatNumber, toIsoDate } from '@/lib/format'
import { LineMetricChart } from '@/ui/charts/LineMetricChart'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'
import { ConfirmSheet } from '@/ui/components/ConfirmSheet'
import { FieldLabel, NumberInput, TextArea, TextField } from '@/ui/components/Field'
import { IconButton } from '@/ui/components/IconButton'
import { Sheet } from '@/ui/components/Sheet'
import { MEASURE_LABEL, MEASURES, type Measure, type StudentAssessment } from './types'

export function AssessmentsCard({
  studentId,
  assessments,
  canManage,
}: {
  studentId: string
  assessments: StudentAssessment[]
  canManage: boolean
}) {
  const [editing, setEditing] = useState<StudentAssessment | 'new' | null>(null)
  const [deleting, setDeleting] = useState<StudentAssessment | null>(null)
  const weights = assessments.filter((a) => a.weightKg !== null).reverse()

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Ruler className="size-5 text-accent" />
          <h2 className="font-bold">Avaliações físicas</h2>
        </div>
        {canManage && (
          <Button
            variant="secondary"
            icon={<Plus className="size-5" />}
            onClick={() => setEditing('new')}
          >
            Nova
          </Button>
        )}
      </div>

      {assessments.length === 0 ? (
        <p className="py-6 text-center text-fg-muted">
          Nenhuma avaliação. O aluno vê as avaliações no app.
        </p>
      ) : (
        <>
          {weights.length >= 2 && (
            <LineMetricChart
              label="Peso nas avaliações"
              height={180}
              data={weights.map((a) => ({
                x: new Date(`${a.assessedOn}T12:00:00`).getTime(),
                y: a.weightKg!,
              }))}
              formatY={(v) => `${formatNumber(v)} kg`}
              formatX={(ms) => formatDate(new Date(ms).toISOString()).slice(0, 5)}
              formatTooltipX={(ms) => formatDate(new Date(ms).toISOString())}
            />
          )}
          <ul className="mt-2 divide-y divide-border">
            {assessments.map((a) => (
              <li key={a.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{formatDate(a.assessedOn)}</p>
                  <p className="text-sm text-fg-muted">
                    {[
                      a.weightKg !== null && `${formatNumber(a.weightKg)} kg`,
                      a.bodyFatPct !== null && `${formatNumber(a.bodyFatPct)}% gordura`,
                      a.weightKg &&
                        a.heightCm &&
                        `IMC ${formatNumber(Math.round((a.weightKg / (a.heightCm / 100) ** 2) * 10) / 10)}`,
                      ...MEASURES.filter((m) => a.measurementsCm[m] !== undefined).map(
                        (m) => `${MEASURE_LABEL[m]} ${formatNumber(a.measurementsCm[m]!)} cm`,
                      ),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {a.notes && <p className="mt-1 text-sm">{a.notes}</p>}
                  {a.author && <p className="mt-1 text-xs text-fg-subtle">Por {a.author}</p>}
                </div>
                {canManage && (
                  <div className="flex shrink-0">
                    <IconButton
                      label="Editar avaliação"
                      icon={<Pencil className="size-5" />}
                      onClick={() => setEditing(a)}
                    />
                    <IconButton
                      label="Excluir avaliação"
                      icon={<Trash2 className="size-5" />}
                      onClick={() => setDeleting(a)}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {editing !== null && (
        <AssessmentSheet
          key={editing === 'new' ? 'new' : editing.id}
          studentId={studentId}
          assessment={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmSheet
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Excluir avaliação?"
        confirmLabel="Excluir"
        danger
        onConfirm={() =>
          deleting &&
          router.delete(`/alunos/${studentId}/avaliacoes/${deleting.id}`, {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
          })
        }
      />
    </Card>
  )
}

function AssessmentSheet({
  studentId,
  assessment,
  onClose,
}: {
  studentId: string
  assessment: StudentAssessment | null
  onClose: () => void
}) {
  const form = useForm({
    assessed_on: assessment?.assessedOn ?? toIsoDate(new Date()),
    weight_kg: assessment?.weightKg ?? null,
    height_cm: assessment?.heightCm ?? null,
    body_fat_pct: assessment?.bodyFatPct ?? null,
    measurements_cm: { ...(assessment?.measurementsCm ?? {}) } as Partial<
      Record<Measure, number | null>
    >,
    notes: assessment?.notes ?? '',
  })

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    const options = { preserveScroll: true, onSuccess: onClose }
    if (assessment) form.put(`/alunos/${studentId}/avaliacoes/${assessment.id}`, options)
    else form.post(`/alunos/${studentId}/avaliacoes`, options)
  }

  const number = (
    label: string,
    value: number | null,
    set: (v: number | null) => void,
    error?: string,
  ) => (
    <div>
      <FieldLabel htmlFor={label}>{label}</FieldLabel>
      <NumberInput id={label} value={value} onValueChange={set} maxFractionDigits={1} />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )

  return (
    <Sheet
      open
      onClose={onClose}
      title={assessment ? 'Editar avaliação' : 'Nova avaliação'}
      footer={
        <Button block onClick={() => submit()} disabled={form.processing}>
          Salvar avaliação
        </Button>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label="Data"
          type="date"
          value={form.data.assessed_on}
          max={toIsoDate(new Date())}
          onChange={(e) => form.setData('assessed_on', e.target.value)}
          error={form.errors.assessed_on}
        />
        <div className="grid grid-cols-3 gap-3">
          {number(
            'Peso (kg)',
            form.data.weight_kg,
            (v) => form.setData('weight_kg', v),
            form.errors.weight_kg,
          )}
          {number(
            'Altura (cm)',
            form.data.height_cm,
            (v) => form.setData('height_cm', v),
            form.errors.height_cm,
          )}
          {number(
            '% gordura',
            form.data.body_fat_pct,
            (v) => form.setData('body_fat_pct', v),
            form.errors.body_fat_pct,
          )}
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-fg-muted">Medidas (cm)</legend>
          <div className="grid grid-cols-3 gap-3">
            {MEASURES.map((m) =>
              number(MEASURE_LABEL[m], form.data.measurements_cm[m] ?? null, (v) =>
                form.setData('measurements_cm', {
                  ...form.data.measurements_cm,
                  [m]: v,
                }),
              ),
            )}
          </div>
        </fieldset>
        <TextArea
          label="Observações"
          value={form.data.notes}
          onChange={(e) => form.setData('notes', e.target.value)}
          error={form.errors.notes}
        />
      </form>
    </Sheet>
  )
}
