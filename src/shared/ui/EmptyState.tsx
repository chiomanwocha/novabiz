import type { ReactNode } from 'react'

export interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

/** Shown when a fetching view loaded successfully but has nothing to display. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <p className="text-base font-medium text-text">{title}</p>
      {description && <p className="text-sm text-muted">{description}</p>}
      {action}
    </div>
  )
}
