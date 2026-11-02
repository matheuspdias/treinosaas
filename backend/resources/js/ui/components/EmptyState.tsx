import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {icon && (
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-surface-2 text-fg-muted">
          {icon}
        </div>
      )}
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-6 w-full max-w-xs">{action}</div>}
    </div>
  )
}
