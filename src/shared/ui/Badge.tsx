import type { ReactNode } from 'react'

export type BadgeTone = 'success' | 'danger' | 'warning' | 'neutral'

export interface BadgeProps {
  tone: BadgeTone
  children: ReactNode
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
  neutral: 'bg-muted/10 text-muted',
}

/** Status is always shown as text + colour together, never colour alone — CLAUDE.md 6.7. */
export function Badge({ tone, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-sm font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  )
}
