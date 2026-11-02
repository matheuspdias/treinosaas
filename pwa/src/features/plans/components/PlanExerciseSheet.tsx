import { Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { formatClock } from '@/domain/duration'
import { PLAN_LIMITS } from '@/domain/plan'
import type { PlanExercise, WeightUnit } from '@/domain/types'
import { fromDisplayUnit, toDisplayUnit, UNIT_LABEL } from '@/domain/units'
import { toast } from '@/stores/toastStore'
import { Button } from '@/ui/components/Button'
import { TextArea } from '@/ui/components/Field'
import { Sheet } from '@/ui/components/Sheet'
import { Stepper } from '@/ui/components/Stepper'
import { removePlanExercise, restorePlanExercise, updatePlanExercise } from '../planActions'

interface Props {
  planId: string
  exercise: PlanExercise | null
  index: number
  name: string
  unit: WeightUnit
  onClose: () => void
}

export function PlanExerciseSheet({ planId, exercise, index, name, unit, onClose }: Props) {
  return (
    <Sheet open={exercise !== null} onClose={onClose} title={name}>
      {exercise && (
        <Body
          key={exercise.id}
          planId={planId}
          exercise={exercise}
          index={index}
          unit={unit}
          name={name}
          onClose={onClose}
        />
      )}
    </Sheet>
  )
}

function Body({
  planId,
  exercise: e,
  index,
  unit,
  name,
  onClose,
}: Omit<Props, 'exercise'> & { exercise: PlanExercise }) {
  const [notes, setNotes] = useState(e.notes)
  const update = (patch: Partial<PlanExercise>) => void updatePlanExercise(planId, e.id, patch)

  // Salva observações pendentes se o painel fechar sem o campo perder o foco (ex.: Esc).
  const pending = useRef({ notes, saved: e.notes })
  useEffect(() => {
    pending.current.notes = notes
  }, [notes])
  useEffect(
    () => () => {
      const { notes: n, saved } = pending.current
      if (n.trim() !== saved) void updatePlanExercise(planId, e.id, { notes: n.trim() })
    },
    [planId, e.id],
  )
  const u = UNIT_LABEL[unit]
  const inUnit = (kg: number) => Math.round(toDisplayUnit(kg, unit) * 100) / 100

  return (
    <div className="space-y-5 pt-2">
      <Stepper
        label="Séries"
        value={e.sets}
        onChange={(sets) => update({ sets })}
        min={PLAN_LIMITS.sets.min}
        max={PLAN_LIMITS.sets.max}
      />
      <div className="grid grid-cols-2 gap-3">
        <Stepper
          label="Reps mín."
          value={e.repMin}
          onChange={(repMin) => update({ repMin })}
          min={1}
          max={100}
        />
        <Stepper
          label="Reps máx."
          value={e.repMax}
          onChange={(repMax) => update({ repMax })}
          min={1}
          max={100}
        />
      </div>
      <Stepper
        label="Carga atual"
        suffix={u}
        maxFractionDigits={2}
        value={inUnit(e.loadKg)}
        step={inUnit(e.incrementKg) || 1}
        max={PLAN_LIMITS.loadKg.max}
        onChange={(v) => update({ loadKg: fromDisplayUnit(v, unit) })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Stepper
          label="Descanso"
          suffix="s"
          hint={formatClock(e.restSec)}
          value={e.restSec}
          step={15}
          max={PLAN_LIMITS.restSec.max}
          onChange={(restSec) => update({ restSec })}
        />
        <Stepper
          label="Incremento"
          suffix={u}
          maxFractionDigits={2}
          value={inUnit(e.incrementKg)}
          step={0.5}
          max={PLAN_LIMITS.incrementKg.max}
          onChange={(v) => update({ incrementKg: fromDisplayUnit(v, unit) })}
        />
      </div>
      <TextArea
        label="Observações"
        placeholder="Ex.: banco na posição 4, pegada fechada"
        value={notes}
        maxLength={300}
        onChange={(ev) => setNotes(ev.target.value)}
        onBlur={() => {
          if (notes.trim() === pending.current.saved) return
          pending.current.saved = notes.trim()
          update({ notes: notes.trim() })
        }}
      />
      <Button
        variant="danger"
        block
        icon={<Trash2 className="size-5" />}
        onClick={async () => {
          const removed = await removePlanExercise(planId, e.id)
          onClose()
          if (removed)
            toast(`${name} removido da ficha.`, {
              action: {
                label: 'Desfazer',
                onClick: () => void restorePlanExercise(planId, removed, index),
              },
            })
        }}
      >
        Remover da ficha
      </Button>
    </div>
  )
}
