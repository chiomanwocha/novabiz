import type { ReactNode } from 'react'

export interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

/** Shown when a fetching view loaded successfully but has nothing to display. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <span aria-hidden="true" className="mb-1 text-4xl">
        🗂️
      </span>
      <p className="text-base font-semibold text-text">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted">{description}</p>}
      {action}
    </div>
  )
}
