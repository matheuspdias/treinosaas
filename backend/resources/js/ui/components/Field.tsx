import { useId, useState } from 'react'
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
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

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="mt-1 text-sm text-danger">
      {message}
    </p>
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
      <FieldError id={`${id}-err`} message={error} />
    </div>
  )
}

export function TextArea({
  label,
  error,
  className,
  ...rest
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & { label: string; error?: string }) {
  const id = useId()
  return (
    <div className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <textarea
        id={id}
        className={cn(inputClass, 'min-h-24 py-3', error && 'border-danger')}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        {...rest}
      />
      <FieldError id={`${id}-err`} message={error} />
    </div>
  )
}

export function SelectField({
  label,
  error,
  className,
  children,
  ...rest
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & { label: string; error?: string }) {
  const id = useId()
  return (
    <div className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <select id={id} className={cn(inputClass, 'appearance-auto pr-3')} {...rest}>
        {children}
      </select>
      <FieldError message={error} />
    </div>
  )
}

/** "2,5" e "2.5" → 2.5; vazio → null. */
export function parseDecimal(raw: string): number | null {
  const t = raw.trim().replace(',', '.')
  if (t === '' || t === '.') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

const fmt = (v: number | null, digits: number) =>
  v === null
    ? ''
    : new Intl.NumberFormat('pt-BR', {
        maximumFractionDigits: digits,
        useGrouping: false,
      }).format(v)

export interface NumberInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> {
  value: number | null
  onValueChange: (value: number | null) => void
  maxFractionDigits?: number
}

/** Campo numérico que aceita vírgula ou ponto, sem atropelar "2," enquanto o usuário digita. */
export function NumberInput({
  value,
  onValueChange,
  maxFractionDigits = 0,
  className,
  onBlur,
  ...rest
}: NumberInputProps) {
  const [text, setText] = useState(() => fmt(value, maxFractionDigits))
  const [synced, setSynced] = useState(value)

  if (value !== synced) {
    setSynced(value)
    if (parseDecimal(text) !== value) setText(fmt(value, maxFractionDigits))
  }

  return (
    <input
      type="text"
      inputMode={maxFractionDigits > 0 ? 'decimal' : 'numeric'}
      autoComplete="off"
      value={text}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const raw = e.target.value
        if (raw !== '' && !(maxFractionDigits > 0 ? /^\d*[.,]?\d*$/ : /^\d*$/).test(raw)) return
        setText(raw)
        onValueChange(parseDecimal(raw))
      }}
      onBlur={(e) => {
        setText(fmt(value, maxFractionDigits))
        onBlur?.(e)
      }}
      className={cn(inputClass, 'text-center font-semibold tabular', className)}
      {...rest}
    />
  )
}
