import { Head } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { Card } from '@/ui/components/Card'

export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string
  description?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Head title={title} />
      <div className="mb-8 flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-control bg-accent text-xl font-extrabold text-accent-fg">
          T
        </span>
        <div>
          <p className="text-lg font-bold">TreinoApp</p>
          <p className="text-sm text-fg-muted">Painel da academia</p>
        </div>
      </div>
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-fg-muted">{description}</p>}
        <div className="mt-6">{children}</div>
      </Card>
    </div>
  )
}
