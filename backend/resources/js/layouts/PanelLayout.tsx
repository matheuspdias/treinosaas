import { Head, Link, router, usePage } from '@inertiajs/react'
import {
  ClipboardList,
  House,
  LogOut,
  Megaphone,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useCan } from '@/lib/useCan'
import type { Ability, SharedData } from '@/types'
import { cn } from '@/ui/cn'
import { FlashToast } from './FlashToast'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  ability: Ability | null
  /** Prefixos de URL que deixam o item ativo. */
  match: string[]
}

const NAV: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Início',
    icon: House,
    ability: 'dashboard.view',
    match: ['/dashboard'],
  },
  { href: '/alunos', label: 'Alunos', icon: Users, ability: 'students.view', match: ['/alunos'] },
  {
    href: '/treinos',
    label: 'Treinos',
    icon: ClipboardList,
    ability: 'programs.manage',
    match: ['/treinos'],
  },
  {
    href: '/avisos',
    label: 'Avisos',
    icon: Megaphone,
    ability: 'notices.manage',
    match: ['/avisos'],
  },
  {
    href: '/settings/profile',
    label: 'Ajustes',
    icon: Settings,
    ability: null,
    match: ['/settings'],
  },
]

export interface PanelLayoutProps {
  /** Título da aba do navegador. */
  title: string
  children: ReactNode
  /** Largura do conteúdo: listas e formulários usam a estreita. */
  width?: 'narrow' | 'wide'
}

/**
 * Celular: conteúdo + abas embaixo (igual ao app do aluno).
 * Computador: barra lateral fixa com a academia, navegação e conta.
 */
export function PanelLayout({ title, children, width = 'wide' }: PanelLayoutProps) {
  const { url, props } = usePage<SharedData>()
  const can = useCan()
  const items = NAV.filter((i) => i.ability === null || can(i.ability))
  const isActive = (i: NavItem) =>
    i.match.some((m) => url === m || url.startsWith(`${m}/`) || url.startsWith(`${m}?`))
  const user = props.auth.user

  return (
    <div className="min-h-dvh lg:pl-72">
      <Head title={title} />
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-3"
      >
        Pular para o conteúdo
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex items-center gap-3 px-6 pt-6 pb-4">
          <span className="flex size-10 items-center justify-center rounded-control bg-accent font-extrabold text-accent-fg">
            T
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold">{props.academy?.name ?? props.name}</p>
            <p className="text-sm text-fg-muted">Painel da academia</p>
          </div>
        </div>
        <nav aria-label="Principal" className="flex-1 px-3">
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const active = isActive(item)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-touch items-center gap-3 rounded-control px-3 font-semibold transition-colors',
                      active
                        ? 'bg-accent-soft text-fg'
                        : 'text-fg-muted hover:bg-surface-2 active:bg-surface-2',
                    )}
                  >
                    <item.icon
                      className={cn('size-5', active && 'text-accent')}
                      strokeWidth={active ? 2.4 : 2}
                    />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        {user && (
          <div className="flex items-center gap-3 border-t border-border p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="truncate text-sm text-fg-muted">{props.academy?.roleLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => router.post('/logout')}
              aria-label="Sair"
              title="Sair"
              className="inline-flex size-touch items-center justify-center rounded-full text-fg-muted hover:bg-surface-2 active:bg-surface-2"
            >
              <LogOut className="size-5" />
            </button>
          </div>
        )}
      </aside>

      <main id="conteudo" className="pb-[calc(env(safe-area-inset-bottom)+5.5rem)] lg:pb-12">
        <div className={cn('mx-auto', width === 'narrow' ? 'max-w-2xl' : 'max-w-5xl')}>
          {children}
        </div>
      </main>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 safe-bottom backdrop-blur-md lg:hidden"
      >
        <ul
          className="mx-auto grid max-w-2xl"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map((item) => {
            const active = isActive(item)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors',
                    active ? 'text-fg' : 'text-fg-subtle',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-14 items-center justify-center rounded-full transition-colors',
                      active && 'bg-accent-soft',
                    )}
                  >
                    <item.icon
                      className={cn('size-6', active && 'text-accent')}
                      strokeWidth={active ? 2.4 : 2}
                    />
                  </span>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <FlashToast />
    </div>
  )
}
