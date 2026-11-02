import { Link } from '@inertiajs/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../cn'

export interface PaginationMeta {
  current_page: number
  last_page: number
  total: number
}

export interface PaginationLinks {
  prev: string | null
  next: string | null
}

export function Pagination({ meta, links }: { meta: PaginationMeta; links: PaginationLinks }) {
  if (meta.last_page <= 1) return null
  const item = (href: string | null, label: string, icon: React.ReactNode) =>
    href ? (
      <Link
        href={href}
        preserveScroll
        aria-label={label}
        className="inline-flex size-touch items-center justify-center rounded-full bg-surface-2 active:bg-surface-3"
      >
        {icon}
      </Link>
    ) : (
      <span
        aria-hidden
        className={cn('inline-flex size-touch items-center justify-center rounded-full opacity-30')}
      >
        {icon}
      </span>
    )
  return (
    <nav aria-label="Paginação" className="flex items-center justify-center gap-4 py-4">
      {item(links.prev, 'Página anterior', <ChevronLeft className="size-5" />)}
      <span className="text-sm text-fg-muted tabular">
        Página {meta.current_page} de {meta.last_page}
      </span>
      {item(links.next, 'Próxima página', <ChevronRight className="size-5" />)}
    </nav>
  )
}
