import { router, usePage } from '@inertiajs/react'
import { ArrowLeft, ArrowRight, Dumbbell, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { ExerciseEditor } from '@/features/programs/ExerciseEditor'
import { ExercisePicker } from '@/features/programs/ExercisePicker'
import { PanelLayout } from '@/layouts/PanelLayout'
import { isoDateInWeeks, validityLabel } from '@/lib/format'
import type { ProgramData, ProgramExerciseData, ProgramPlanData, SharedData } from '@/types'
import { cn } from '@/ui/cn'
import { Badge } from '@/ui/components/Badge'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'
import { Chip } from '@/ui/components/Chip'
import { EmptyState } from '@/ui/components/EmptyState'
import { TextArea, TextField } from '@/ui/components/Field'
import { IconButton } from '@/ui/components/IconButton'
import { PageHeader } from '@/ui/components/PageHeader'
import { Switch } from '@/ui/components/Switch'
import { PLAN_COLOR_BG, PLAN_COLOR_LABEL, PLAN_COLORS, type PlanColor } from '@/ui/theme/planColors'

interface Props {
  program: ProgramData | null
  student: { id: string; name: string } | null
  copiedFrom: string | null
  catalogUrl: string
}

const LETTERS = 'ABCDEFGHIJ'
const VALIDITY_WEEKS = [4, 6, 8, 12]

const newPlan = (index: number): ProgramPlanData => ({
  id: null,
  name: `Treino ${LETTERS[index] ?? index + 1}`,
  color: PLAN_COLORS[index % PLAN_COLORS.length]!,
  exercises: [],
})

export default function ProgramEditor({ program, student, copiedFrom, catalogUrl }: Props) {
  const { errors } = usePage<SharedData>().props
  const isTemplate = student === null
  const isEdit = program?.id != null
  const [name, setName] = useState(program?.name ?? (isTemplate ? '' : 'Treino de hipertrofia'))
  const [notes, setNotes] = useState(program?.notes ?? '')
  const [expiresOn, setExpiresOn] = useState<string | null>(
    program?.expiresOn ?? (isTemplate ? null : isoDateInWeeks(6)),
  )
  const [replaceCurrent, setReplaceCurrent] = useState(true)
  const [plans, setPlans] = useState<ProgramPlanData[]>(
    program?.plans.length ? program.plans : [newPlan(0)],
  )
  const [active, setActive] = useState(0)
  const [picking, setPicking] = useState(false)
  const [saving, setSaving] = useState(false)
  const plan = plans[Math.min(active, plans.length - 1)]!
  const planIndex = plans.indexOf(plan)

  const back = student ? `/alunos/${student.id}` : '/treinos'
  const title = isEdit
    ? isTemplate
      ? 'Editar modelo'
      : 'Editar treino'
    : isTemplate
      ? 'Novo modelo'
      : 'Novo treino'

  const updatePlan = (patch: Partial<ProgramPlanData>) =>
    setPlans((ps) => ps.map((p, i) => (i === planIndex ? { ...p, ...patch } : p)))
  const updateExercise = (ei: number, patch: Partial<ProgramExerciseData>) =>
    updatePlan({ exercises: plan.exercises.map((e, i) => (i === ei ? { ...e, ...patch } : e)) })
  const moveExercise = (ei: number, dir: -1 | 1) => {
    const list = [...plan.exercises]
    ;[list[ei], list[ei + dir]] = [list[ei + dir]!, list[ei]!]
    updatePlan({ exercises: list })
  }
  const movePlan = (dir: -1 | 1) => {
    const list = [...plans]
    ;[list[planIndex], list[planIndex + dir]] = [list[planIndex + dir]!, list[planIndex]!]
    setPlans(list)
    setActive(planIndex + dir)
  }

  /** Erros do servidor vêm como "plans.0.exercises.2.sets". */
  const exerciseErrors = (pi: number, ei: number) =>
    Object.fromEntries(
      Object.entries(errors)
        .filter(([k]) => k.startsWith(`plans.${pi}.exercises.${ei}.`))
        .map(([k, v]) => [k.split('.').at(-1)!, v]),
    )
  const planHasError = (pi: number) => Object.keys(errors).some((k) => k.startsWith(`plans.${pi}.`))
  const generalErrors = Object.entries(errors)
    .filter(([k]) => k === 'plans' || /^plans\.\d+\.(name|color)$/.test(k))
    .map(([, v]) => v)

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    const payload = {
      name,
      notes: notes || null,
      expires_on: isTemplate ? null : expiresOn,
      starts_on: program?.startsOn ?? null,
      replace_current: replaceCurrent,
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        exercises: p.exercises.map((x) => ({
          id: x.id,
          exercise_id: x.exerciseId,
          sets: x.sets,
          rep_min: x.repMin,
          rep_max: x.repMax,
          load_kg: x.loadKg,
          rest_sec: x.restSec,
          increment_kg: x.incrementKg,
          notes: x.notes,
        })),
      })),
    }
    const options = { preserveScroll: true, onFinish: () => setSaving(false) }
    setSaving(true)
    if (isEdit) router.put(`/treinos/${program!.id}`, payload, options)
    else if (student) router.post(`/alunos/${student.id}/treinos`, payload, options)
    else router.post('/treinos', payload, options)
  }

  return (
    <PanelLayout title={title}>
      <PageHeader
        title={title}
        subtitle={
          student
            ? `Para ${student.name}`
            : copiedFrom
              ? `A partir de "${copiedFrom}"`
              : 'Modelo da academia'
        }
        back={back}
        actions={
          <Button onClick={() => submit()} disabled={saving} className="hidden lg:inline-flex">
            Salvar
          </Button>
        }
      />

      <form onSubmit={submit} className="flex flex-col gap-4 px-4 pt-2 pb-24 lg:px-6 lg:pb-0">
        <Card className="grid gap-4 p-5 lg:grid-cols-2">
          <TextField
            label="Nome do treino"
            required
            maxLength={120}
            placeholder="Ex.: Hipertrofia ABC"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          {!isTemplate && (
            <div>
              <p className="mb-1.5 text-sm font-semibold text-fg-muted">Validade da ficha</p>
              <div className="flex flex-wrap gap-2">
                {VALIDITY_WEEKS.map((w) => (
                  <Chip
                    key={w}
                    selected={expiresOn === isoDateInWeeks(w)}
                    onClick={() => setExpiresOn(isoDateInWeeks(w))}
                  >
                    {w} sem.
                  </Chip>
                ))}
                <Chip selected={expiresOn === null} onClick={() => setExpiresOn(null)}>
                  Sem validade
                </Chip>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="date"
                  aria-label="Data de validade"
                  value={expiresOn ?? ''}
                  onChange={(e) => setExpiresOn(e.target.value || null)}
                  className="min-h-11 rounded-control border border-border bg-surface-2 px-3"
                />
                {expiresOn && <Badge>{validityLabel(expiresOn)}</Badge>}
              </div>
              {errors.expires_on && <p className="mt-1 text-sm text-danger">{errors.expires_on}</p>}
            </div>
          )}
          <TextArea
            label="Orientações gerais (opcional)"
            className="lg:col-span-2"
            placeholder="Ex.: aquecer 10 min na esteira antes; beber água entre os exercícios"
            maxLength={2000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            error={errors.notes}
          />
          {!isTemplate && !isEdit && (
            <div className="lg:col-span-2">
              <Switch
                label="Substituir o treino atual"
                description="O treino anterior sai do app do aluno e fica no histórico."
                checked={replaceCurrent}
                onChange={setReplaceCurrent}
              />
            </div>
          )}
        </Card>

        {generalErrors.length > 0 && (
          <p role="alert" className="rounded-control bg-danger-soft p-3 text-danger">
            {generalErrors[0]}
          </p>
        )}

        <div
          className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0"
          role="tablist"
          aria-label="Fichas"
        >
          {plans.map((p, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === planIndex}
              onClick={() => setActive(i)}
              className={cn(
                'inline-flex min-h-touch shrink-0 items-center gap-2 rounded-full border px-4 font-semibold whitespace-nowrap',
                i === planIndex
                  ? 'border-fg bg-surface'
                  : 'border-border bg-surface-2 text-fg-muted',
                planHasError(i) && 'border-danger text-danger',
              )}
            >
              <span className={cn('size-3 rounded-full', PLAN_COLOR_BG[p.color])} aria-hidden />
              {p.name || `Ficha ${i + 1}`}
              <span className="text-sm font-normal text-fg-subtle tabular">
                {p.exercises.length}
              </span>
            </button>
          ))}
          {plans.length < 10 && (
            <Button
              variant="ghost"
              icon={<Plus className="size-5" />}
              onClick={() => {
                setPlans((ps) => [...ps, newPlan(ps.length)])
                setActive(plans.length)
              }}
            >
              Ficha
            </Button>
          )}
        </div>

        <Card className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-end gap-3">
            <TextField
              label="Nome da ficha"
              className="min-w-40 flex-1"
              maxLength={40}
              value={plan.name}
              onChange={(e) => updatePlan({ name: e.target.value })}
              error={errors[`plans.${planIndex}.name`]}
            />
            <div className="flex">
              <IconButton
                label="Mover ficha para a esquerda"
                icon={<ArrowLeft className="size-5" />}
                disabled={planIndex === 0}
                onClick={() => movePlan(-1)}
              />
              <IconButton
                label="Mover ficha para a direita"
                icon={<ArrowRight className="size-5" />}
                disabled={planIndex === plans.length - 1}
                onClick={() => movePlan(1)}
              />
              <IconButton
                label="Excluir ficha"
                icon={<Trash2 className="size-5" />}
                disabled={plans.length === 1}
                onClick={() => {
                  if (plan.exercises.length && !confirm(`Excluir ${plan.name} e seus exercícios?`))
                    return
                  setPlans((ps) => ps.filter((_, i) => i !== planIndex))
                  setActive(Math.max(0, planIndex - 1))
                }}
              />
            </div>
          </div>
          <div role="radiogroup" aria-label="Cor da ficha" className="flex flex-wrap gap-2">
            {PLAN_COLORS.map((c: PlanColor) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={plan.color === c}
                aria-label={PLAN_COLOR_LABEL[c]}
                title={PLAN_COLOR_LABEL[c]}
                onClick={() => updatePlan({ color: c })}
                className={cn(
                  'size-9 rounded-full ring-offset-2 ring-offset-surface',
                  PLAN_COLOR_BG[c],
                  plan.color === c && 'ring-3 ring-fg',
                )}
              />
            ))}
          </div>
        </Card>

        {plan.exercises.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Dumbbell className="size-8" />}
              title="Ficha vazia"
              description="Adicione os exercícios na ordem em que o aluno vai fazer."
              action={
                <Button block icon={<Plus className="size-5" />} onClick={() => setPicking(true)}>
                  Adicionar exercícios
                </Button>
              }
            />
          </Card>
        ) : (
          <>
            {plan.exercises.map((x, ei) => (
              <ExerciseEditor
                key={x.id ?? `${planIndex}-${ei}-${x.exerciseId}`}
                index={ei}
                exercise={x}
                errors={exerciseErrors(planIndex, ei)}
                isFirst={ei === 0}
                isLast={ei === plan.exercises.length - 1}
                onChange={(patch) => updateExercise(ei, patch)}
                onMove={(dir) => moveExercise(ei, dir)}
                onRemove={() =>
                  updatePlan({
                    exercises: plan.exercises.filter((_, i) => i !== ei),
                  })
                }
              />
            ))}
            <Button
              variant="secondary"
              size="lg"
              icon={<Plus className="size-5" />}
              onClick={() => setPicking(true)}
            >
              Adicionar exercícios
            </Button>
          </>
        )}

        <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4rem)] z-20 border-t border-border bg-surface/95 p-3 backdrop-blur-md lg:hidden">
          <Button type="submit" block size="lg" disabled={saving}>
            {isEdit
              ? 'Salvar alterações'
              : isTemplate
                ? 'Criar modelo'
                : `Enviar para ${student!.name.split(' ')[0]}`}
          </Button>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={saving}
          className="hidden self-start lg:inline-flex"
        >
          {isEdit
            ? 'Salvar alterações'
            : isTemplate
              ? 'Criar modelo'
              : `Enviar para ${student!.name.split(' ')[0]}`}
        </Button>
      </form>

      <ExercisePicker
        open={picking}
        catalogUrl={catalogUrl}
        planName={plan.name}
        onClose={() => setPicking(false)}
        onAdd={(ex) =>
          setPlans((ps) =>
            ps.map((p, i) =>
              i === planIndex
                ? {
                    ...p,
                    exercises: [
                      ...p.exercises,
                      {
                        id: null,
                        exerciseId: ex.id,
                        exerciseName: ex.name,
                        sets: 3,
                        repMin: 8,
                        repMax: 12,
                        loadKg: 0,
                        restSec: 90,
                        incrementKg: 2.5,
                        notes: null,
                      },
                    ],
                  }
                : p,
            ),
          )
        }
      />
    </PanelLayout>
  )
}
