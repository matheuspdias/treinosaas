import { ChevronRight, Search, Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useCompletedSessions, useSettings } from '@/data/hooks'
import { personalRecords } from '@/domain/history'
import { normalizeText } from '@/domain/text'
import { formatVolume, formatWeight } from '@/domain/units'
import { cn } from '@/ui/cn'
import { Card } from '@/ui/components/Card'
import { EmptyState } from '@/ui/components/EmptyState'
import { inputClass } from '@/ui/components/Field'
import { PageHeader } from '@/ui/components/PageHeader'
import { PageSpinner } from '@/ui/components/Spinner'
import { roundHalf, shortDate } from './format'

const RECENT_DAYS = 7

export function RecordsPage() {
  const sessions = useCompletedSessions()
  const { weightUnit: unit } = useSettings()
  const [query, setQuery] = useState('')
  // Momento de abertura da tela: referência fixa para o selo "Novo".
  const [openedAt] = useState(() => Date.now())
  const records = useMemo(() => (sessions ? personalRecords(sessions) : undefined), [sessions])

  if (!records) return <PageSpinner />
  const q = normalizeText(query)
  const list = q ? records.filter((r) => normalizeText(r.exerciseName).includes(q)) : records
  const recentFrom = openedAt - RECENT_DAYS * 86_400_000
  const isRecent = (iso: string) => new Date(iso).getTime() >= recentFrom

  return (
    <>
      <PageHeader back="/progresso" title="Recordes pessoais" />
      {records.length === 0 ? (
        <EmptyState
          icon={<Trophy className="size-8" />}
          title="Nenhum recorde ainda"
          description="Conclua treinos para registrar suas melhores marcas."
        />
      ) : (
        <div className="px-4 pb-8">
          <div className="relative mb-4">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-fg-subtle"
              aria-hidden
            />
            <input
              type="search"
              aria-label="Buscar exercício"
              placeholder="Buscar exercício"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(inputClass, 'pl-11')}
            />
          </div>
          <ul className="space-y-3">
            {list.map((r) => {
              const recent =
                isRecent(r.weight.date) || isRecent(r.e1rm.date) || isRecent(r.setVolume.date)
              const items = [
                {
                  label: 'Maior carga',
                  value: formatWeight(r.weight.value, unit),
                  entry: r.weight,
                },
                {
                  label: '1RM estimado',
                  value: formatWeight(roundHalf(r.e1rm.value), unit),
                  entry: r.e1rm,
                },
                {
                  label: 'Volume/série',
                  value: formatVolume(r.setVolume.value, unit),
                  entry: r.setVolume,
                },
              ]
              return (
                <li key={`${r.exercise.source}:${r.exercise.id}`}>
                  <Link
                    to={`/exercicios/${r.exercise.source}/${encodeURIComponent(r.exercise.id)}/historico`}
                    className="block active:opacity-80"
                  >
                    <Card className={cn('p-4', recent && 'border border-warning/50')}>
                      <div className="mb-3 flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate font-bold">{r.exerciseName}</p>
                        {recent && (
                          <span className="flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-bold">
                            <Trophy className="size-3.5 text-warning" aria-hidden />
                            Novo
                          </span>
                        )}
                        <ChevronRight className="size-5 shrink-0 text-fg-subtle" aria-hidden />
                      </div>
                      <dl className="grid grid-cols-3 gap-2">
                        {items.map((it) => (
                          <div key={it.label}>
                            <dt className="text-xs text-fg-muted">{it.label}</dt>
                            <dd className="font-extrabold">{it.value}</dd>
                            <dd
                              className={cn(
                                'text-xs',
                                isRecent(it.entry.date)
                                  ? 'font-semibold text-fg'
                                  : 'text-fg-subtle',
                              )}
                            >
                              {shortDate.format(new Date(it.entry.date))}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </Card>
                  </Link>
                </li>
              )
            })}
          </ul>
          {list.length === 0 && (
            <p className="py-8 text-center text-fg-muted">Nenhum exercício encontrado.</p>
          )}
        </div>
      )}
    </>
  )
}
