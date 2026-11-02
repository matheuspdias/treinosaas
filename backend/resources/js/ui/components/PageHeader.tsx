import { Link } from '@inertiajs/react'
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'

export interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  /** URL do botão voltar. */
  back?: string
  actions?: ReactNode
}

/** Cabeçalho fixo no celular (como no app); no computador vira um título de página. */
export function PageHeader({ title, subtitle, back, actions }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-bg/90 safe-top backdrop-blur-md lg:static lg:bg-transparent lg:pt-8 lg:backdrop-blur-none">
      <div className="flex min-h-16 items-center gap-1 px-2 lg:px-6">
        {back ? (
          <Link
            href={back}
            aria-label="Voltar"
            title="Voltar"
            className="inline-flex size-touch shrink-0 items-center justify-center rounded-full active:bg-surface-2 lg:-ml-3"
          >
            <ChevronLeft className="size-7" />
          </Link>
        ) : (
          <div className="w-2 lg:hidden" />
        )}
        <div className="min-w-0 flex-1 py-2">
          <h1 className="truncate text-xl font-bold tracking-tight lg:text-2xl">{title}</h1>
          {subtitle && <p className="truncate text-sm text-fg-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 pr-1">{actions}</div>}
      </div>
    </header>
  )
}
