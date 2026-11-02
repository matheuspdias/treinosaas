import { ArrowDown, ArrowUp, MessageSquareText, Trash2 } from 'lucide-react'
import { useId, useState } from 'react'
import { exerciseImage } from '@/lib/catalog'
import { formatRest } from '@/lib/format'
import type { ProgramExerciseData } from '@/types'
import { cn } from '@/ui/cn'
import { Card } from '@/ui/components/Card'
import { FieldLabel, inputClass, NumberInput } from '@/ui/components/Field'
import { IconButton } from '@/ui/components/IconButton'

const REST_OPTIONS = [30, 45, 60, 75, 90, 120, 150, 180, 240, 300]

export function ExerciseEditor({
  index,
  exercise,
  errors,
  isFirst,
  isLast,
  onChange,
  onMove,
  onRemove,
}: {
  index: number
  exercise: ProgramExerciseData
  /** Erros do servidor deste exercício, por campo (sets, rep_min...). */
  errors: Record<string, string>
  isFirst: boolean
  isLast: boolean
  onChange: (patch: Partial<ProgramExerciseData>) => void
  onMove: (dir: -1 | 1) => void
  onRemove: () => void
}) {
  const id = useId()
  const [showNotes, setShowNotes] = useState(Boolean(exercise.notes))
  const errorList = Object.values(errors)
  const num = (
    label: string,
    value: number,
    key: keyof ProgramExerciseData,
    digits = 0,
    errorKey?: string,
    span?: string,
  ) => (
    <div className={cn(span, 'sm:col-span-1')}>
      <FieldLabel htmlFor={`${id}-${key}`}>{label}</FieldLabel>
      <NumberInput
        id={`${id}-${key}`}
        value={value}
        maxFractionDigits={digits}
        onValueChange={(v) => onChange({ [key]: v ?? 0 })}
        className={cn(errorKey && errors[errorKey] && 'border-danger')}
      />
    </div>
  )

  return (
    <Card className={cn('p-4', errorList.length > 0 && 'ring-2 ring-danger')}>
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-bold tabular">
          {index + 1}
        </span>
        <img
          src={exerciseImage(exercise.exerciseId)}
          alt=""
          loading="lazy"
          className="size-14 shrink-0 rounded-control bg-surface-2 object-cover"
        />
        <p className="min-w-0 flex-1 pt-1 font-semibold">{exercise.exerciseName}</p>
        {/* No celular os botões descem para a linha de baixo e o nome fica com a largura toda. */}
        <div className="-my-1 -mr-2 flex w-full justify-end sm:w-auto sm:shrink-0">
          <IconButton
            label="Subir"
            icon={<ArrowUp className="size-5" />}
            disabled={isFirst}
            onClick={() => onMove(-1)}
          />
          <IconButton
            label="Descer"
            icon={<ArrowDown className="size-5" />}
            disabled={isLast}
            onClick={() => onMove(1)}
          />
          <IconButton
            label={`Remover ${exercise.exerciseName}`}
            icon={<Trash2 className="size-5" />}
            onClick={onRemove}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-6 gap-3 sm:grid-cols-5">
        {num('Séries', exercise.sets, 'sets', 0, 'sets', 'col-span-2')}
        {num('Reps mín.', exercise.repMin, 'repMin', 0, 'rep_min', 'col-span-2')}
        {num('Reps máx.', exercise.repMax, 'repMax', 0, 'rep_max', 'col-span-2')}
        {num('Carga (kg)', exercise.loadKg, 'loadKg', 2, 'load_kg', 'col-span-3')}
        <div className="col-span-3 sm:col-span-1">
          <FieldLabel htmlFor={`${id}-rest`}>Descanso</FieldLabel>
          <select
            id={`${id}-rest`}
            value={exercise.restSec}
            onChange={(e) => onChange({ restSec: Number(e.target.value) })}
            className={cn(inputClass, 'appearance-auto px-3')}
          >
            {[...new Set([...REST_OPTIONS, exercise.restSec])]
              .sort((a, b) => a - b)
              .map((s) => (
                <option key={s} value={s}>
                  {formatRest(s)}
                </option>
              ))}
          </select>
        </div>
      </div>

      {showNotes ? (
        <div className="mt-3">
          <FieldLabel htmlFor={`${id}-notes`} hint="O aluno vê durante o treino">
            Observação do professor
          </FieldLabel>
          <textarea
            id={`${id}-notes`}
            rows={2}
            maxLength={500}
            placeholder="Ex.: desça em 3 segundos, cotovelos a 45°"
            value={exercise.notes ?? ''}
            onChange={(e) => onChange({ notes: e.target.value })}
            className={cn(inputClass, 'min-h-20 py-3')}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowNotes(true)}
          className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-fg-muted"
        >
          <MessageSquareText className="size-4" /> Adicionar observação (postura, cadência...)
        </button>
      )}

      {errorList.length > 0 && <p className="mt-2 text-sm text-danger">{errorList[0]}</p>}
    </Card>
  )
}
