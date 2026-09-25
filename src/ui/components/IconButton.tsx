import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../cn'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Obrigatório: botões só com ícone precisam de nome acessível. */
  label: string
  icon: ReactNode
  variant?: 'ghost' | 'secondary' | 'primary'
  size?: 'md' | 'lg'
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full transition-[background-color,transform] duration-150 select-none active:scale-95 disabled:pointer-events-none disabled:opacity-40',
        size === 'md' ? 'size-touch' : 'size-touch-lg',
        variant === 'ghost' && 'text-fg active:bg-surface-2',
        variant === 'secondary' && 'bg-surface-2 text-fg active:bg-surface-3',
        variant === 'primary' && 'bg-accent text-accent-fg active:brightness-90',
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  )
}
