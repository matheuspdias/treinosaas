import { useId, useState } from 'react'
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { formatNumber, parseDecimal } from '@/domain/units'
import { cn } from '../cn'

export const inputClass =
  'min-h-touch w-full rounded-control border border-border bg-surface-2 px-4 text-fg placeholder:text-fg-subtle focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40'

export function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor: string
  children: ReactNode
  hint?: ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-semibold text-fg-muted"
    >
      <span>{children}</span>
      {hint && <span className="font-normal text-fg-subtle">{hint}</span>}
    </label>
  )
}

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  hint?: ReactNode
  error?: string
}

export function TextField({ label, hint, error, className, ...rest }: TextFieldProps) {
  const id = useId()
  return (
    <div className={className}>
      <FieldLabel htmlFor={id} hint={hint}>
        {label}
      </FieldLabel>
      <input
        id={id}
        className={cn(inputClass, error && 'border-danger')}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${id}-err`} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

export function TextArea({
  label,
  className,
  ...rest
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & { label: string }) {
  const id = useId()
  return (
    <div className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <textarea id={id} className={cn(inputClass, 'min-h-24 py-3')} {...rest} />
    </div>
  )
}

export interface DecimalInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> {
  value: number | null
  onValueChange: (value: number | null) => void
  maxFractionDigits?: number
}

/**
 * Campo numérico que aceita vírgula ou ponto. Mantém o texto digitado enquanto o
 * usuário edita e só sincroniza com o valor externo quando ele muda de fora.
 */
export function DecimalInput({
  value,
  onValueChange,
  maxFractionDigits = 2,
  className,
  onBlur,
  ...rest
}: DecimalInputProps) {
  const format = (v: number | null) =>
    v === null ? '' : formatNumber(v, maxFractionDigits).replace(/\./g, '')
  const [text, setText] = useState(() => format(value))
  const [syncedValue, setSyncedValue] = useState(value)

  // Sincroniza quando o valor muda por fora (ex.: stepper), sem atropelar "2," em edição.
  if (value !== syncedValue) {
    setSyncedValue(value)
    if (parseDecimal(text) !== value) setText(format(value))
  }

  return (
    <input
      type="text"
      inputMode={maxFractionDigits > 0 ? 'decimal' : 'numeric'}
      autoComplete="off"
      enterKeyHint="done"
      value={text}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const raw = e.target.value
        if (raw !== '' && !/^\d*[.,]?\d*$/.test(raw)) return
        setText(raw)
        onValueChange(parseDecimal(raw))
      }}
      onBlur={(e) => {
        setText(format(value))
        onBlur?.(e)
      }}
      className={cn(inputClass, 'text-center font-semibold tabular', className)}
      {...rest}
    />
  )
}
