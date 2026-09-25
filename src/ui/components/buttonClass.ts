import { cn } from '../cn'

export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
export type Size = 'md' | 'lg'

export interface ButtonStyle {
  variant?: Variant
  size?: Size
  block?: boolean
}

const VARIANT: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg active:brightness-90',
  secondary: 'bg-surface-2 text-fg active:bg-surface-3',
  ghost: 'bg-transparent text-fg active:bg-surface-2',
  danger: 'bg-danger-soft text-danger active:brightness-95',
  success: 'bg-success text-bg active:brightness-90',
}

const SIZE: Record<Size, string> = {
  md: 'min-h-touch px-4 text-base gap-2',
  lg: 'min-h-touch-lg px-5 text-lg gap-2.5',
}

export function buttonClass({
  variant = 'primary',
  size = 'md',
  block = false,
}: ButtonStyle = {}): string {
  return cn(
    'inline-flex select-none items-center whitespace-nowrap justify-center rounded-control font-semibold transition-[filter,background-color,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40',
    VARIANT[variant],
    SIZE[size],
    block && 'w-full',
  )
}
