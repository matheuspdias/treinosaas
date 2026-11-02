import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../cn'
import { buttonClass } from './buttonClass'
import type { ButtonStyle } from './buttonClass'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyle {
  icon?: ReactNode
}

export function Button({
  variant,
  size,
  icon,
  block,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={cn(buttonClass({ variant, size, block }), className)} {...rest}>
      {icon}
      {children}
    </button>
  )
}
