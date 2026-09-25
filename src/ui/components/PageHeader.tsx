import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { IconButton } from './IconButton'

export interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  /** Mostra botão voltar. String = rota de destino; true = histórico. */
  back?: string | true
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, back, actions }: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-20 bg-bg/90 safe-top backdrop-blur-md">
      <div className="flex min-h-16 items-center gap-1 px-2">
        {back ? (
          <IconButton
            label="Voltar"
            icon={<ChevronLeft className="size-7" />}
            onClick={() => (back === true ? navigate(-1) : navigate(back))}
          />
        ) : (
          <div className="w-2" />
        )}
        <div className="min-w-0 flex-1 py-2">
          <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="truncate text-sm text-fg-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-1 pr-1">{actions}</div>}
      </div>
    </header>
  )
}
