import type { ReactNode } from 'react'

export type BadgeTone = 'success' | 'danger' | 'warning' | 'neutral'

export interface BadgeProps {
  tone: BadgeTone
  children: ReactNode
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: 'bg-success-bg text-success',
  danger: 'bg-danger-bg text-danger',
  warning: 'bg-warning-bg text-warning',
  neutral: 'bg-muted/10 text-muted',
}

/** Status is always shown as text + colour together, never colour alone — CLAUDE.md 6.7. */
export function Badge({ tone, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASSES[tone]}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}
