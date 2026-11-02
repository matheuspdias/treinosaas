import { History } from 'lucide-react'
import { useState } from 'react'
import { formatDateTime, formatDuration, formatWeight } from '@/lib/format'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'
import type { StudentSession } from './types'

export function SessionsCard({ sessions }: { sessions: StudentSession[] }) {
  const [all, setAll] = useState(false)
  const shown = all ? sessions : sessions.slice(0, 8)
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <History className="size-5 text-accent" />
        <h2 className="font-bold">Últimos treinos</h2>
      </div>
      {sessions.length === 0 ? (
        <p className="py-6 text-center text-fg-muted">
          Nenhum treino da academia registrado ainda.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {shown.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{s.planName}</p>
                <p className="text-sm text-fg-muted">{formatDateTime(s.finishedAt)}</p>
              </div>
              <div className="text-right text-sm tabular">
                <p className="font-semibold">{formatDuration(s.durationSec)}</p>
                <p className="text-fg-muted">
                  {s.setsCount} séries · {formatWeight(Math.round(s.volumeKg))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {sessions.length > shown.length && (
        <Button variant="ghost" block onClick={() => setAll(true)}>
          Ver todos ({sessions.length})
        </Button>
      )}
    </Card>
  )
}
