import { Link, usePage } from '@inertiajs/react'
import { useCan } from '@/lib/useCan'
import { cn } from '@/ui/cn'

const ITEMS = [
  { href: '/settings/profile', label: 'Perfil' },
  { href: '/settings/password', label: 'Senha' },
  { href: '/settings/appearance', label: 'Aparência' },
]

export function SettingsNav() {
  const { url } = usePage()
  const can = useCan()
  const items = can('academy.manage')
    ? [...ITEMS, { href: '/settings/app', label: 'App do aluno' }]
    : ITEMS
  return (
    <nav aria-label="Ajustes" className="flex gap-2 overflow-x-auto px-4 pb-2 lg:px-6">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={url.startsWith(i.href) ? 'page' : undefined}
          className={cn(
            'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold whitespace-nowrap',
            url.startsWith(i.href)
              ? 'border-accent bg-accent text-accent-fg'
              : 'border-border bg-surface text-fg active:bg-surface-2',
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  )
}
