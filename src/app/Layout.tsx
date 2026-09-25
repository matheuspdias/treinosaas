import { ChartNoAxesColumnIncreasing, ClipboardList, Dumbbell, House, Settings } from 'lucide-react'
import { Suspense } from 'react'
import { NavLink, Outlet, ScrollRestoration, useLocation, useNavigation } from 'react-router'
import { cn } from '@/ui/cn'
import { PageSpinner } from '@/ui/components/Spinner'
import { ActiveWorkoutBar } from './ActiveWorkoutBar'

const TABS = [
  { to: '/', label: 'Início', icon: House, end: true },
  { to: '/fichas', label: 'Fichas', icon: ClipboardList, end: false },
  { to: '/progresso', label: 'Progresso', icon: ChartNoAxesColumnIncreasing, end: false },
  { to: '/exercicios', label: 'Exercícios', icon: Dumbbell, end: false },
  { to: '/ajustes', label: 'Ajustes', icon: Settings, end: false },
] as const

/** Telas em tela cheia (sem barra de navegação). */
const FULLSCREEN = [/^\/treino/, /^\/fichas\/[^/]+\/adicionar/]

export function Layout() {
  const { pathname } = useLocation()
  const navigation = useNavigation()
  const fullscreen = FULLSCREEN.some((re) => re.test(pathname))

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-3"
      >
        Pular para o conteúdo
      </a>
      <main
        id="conteudo"
        className={cn('flex-1', !fullscreen && 'pb-[calc(env(safe-area-inset-bottom)+5.5rem)]')}
      >
        {navigation.state === 'loading' && (
          <div className="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-accent" aria-hidden />
        )}
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
      </main>

      {!fullscreen && (
        <div className="fixed inset-x-0 bottom-0 z-30">
          <div className="mx-auto max-w-2xl">
            <ActiveWorkoutBar />
            <nav
              aria-label="Principal"
              className="border-t border-border bg-surface/95 safe-bottom backdrop-blur-md"
            >
              <ul className="grid grid-cols-5">
                {TABS.map(({ to, label, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        cn(
                          'flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors',
                          isActive ? 'text-fg' : 'text-fg-subtle',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              'flex h-8 w-14 items-center justify-center rounded-full transition-colors',
                              isActive && 'bg-accent-soft',
                            )}
                          >
                            <Icon
                              className={cn('size-6', isActive && 'text-accent')}
                              strokeWidth={isActive ? 2.4 : 2}
                            />
                          </span>
                          {label}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
      <ScrollRestoration />
    </div>
  )
}
