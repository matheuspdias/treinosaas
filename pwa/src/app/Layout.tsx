import { ChartNoAxesColumnIncreasing, ClipboardList, Dumbbell, House, Settings } from 'lucide-react'
import { Suspense } from 'react'
import {
  Navigate,
  NavLink,
  Outlet,
  ScrollRestoration,
  useLocation,
  useNavigation,
} from 'react-router'
import { useAcademyFeedState, useAcademySession } from '@/data/hooks'
import { accessState } from '@/domain/academy'
import { AccessBlockedScreen } from '@/features/academy/AccessBlockedScreen'
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
const FULLSCREEN = [
  /^\/treino/,
  /^\/fichas\/[^/]+\/adicionar/,
  /^\/boas-vindas/,
  /^\/importar/,
  /^\/academia\/entrar/,
]

const LOGIN_PATH = '/academia/entrar'

export function Layout() {
  const { pathname } = useLocation()
  const navigation = useNavigation()
  const session = useAcademySession()
  const feed = useAcademyFeedState()
  const fullscreen = FULLSCREEN.some((re) => re.test(pathname))

  // O app só funciona com aluno logado numa academia em dia (sem modo avulso).
  if (session === undefined || feed === undefined) return <PageSpinner />
  const access = accessState(session, feed)
  const onLogin = pathname.startsWith(LOGIN_PATH)
  if (!session || access === 'login') {
    if (!onLogin) return <Navigate to={LOGIN_PATH} replace />
    return (
      <main id="conteudo" className="mx-auto min-h-dvh max-w-2xl">
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
      </main>
    )
  }
  if (onLogin) return <Navigate to="/" replace />
  if (access !== 'ok') {
    return (
      <AccessBlockedScreen
        session={session}
        reason={access}
        message={feed.blocked?.message ?? null}
      />
    )
  }

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
