import type { ReactNode } from 'react'

export type InsightTone = 'up' | 'down' | 'flat'
export type InsightIconTone = 'primary' | 'success' | 'accent' | 'warning'

export interface InsightCardProps {
  label: string
  value: string
  helperText?: string
  tone?: InsightTone
  /** 0-100. Renders a thin progress bar under the helper text, e.g. for a usage gauge. */
  progressPercent?: number
  /** Extra visual content under the helper text, e.g. a small comparison chart. */
  children?: ReactNode
  /** A small decorative glyph identifying the metric at a glance — never the only signal. */
  icon?: ReactNode
  /** Tints the icon chip so tiles aren't all the same flat grey — purely decorative. */
  iconTone?: InsightIconTone
  /** Lets a tile span 2 columns in the bento layout, for one that carries extra content. */
  wide?: boolean
}

const TONE_CLASSES: Record<InsightTone, string> = {
  up: 'text-success',
  down: 'text-danger',
  flat: 'text-muted',
}

const PROGRESS_BAR_CLASSES: Record<InsightTone, string> = {
  up: 'bg-primary',
  down: 'bg-danger',
  flat: 'bg-primary',
}

const ICON_TONE_CLASSES: Record<InsightIconTone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success-bg text-success',
  accent: 'bg-accent/15 text-accent-hover',
  warning: 'bg-warning/15 text-warning',
}

/** One at-a-glance metric tile inside the dashboard's InsightsPanel. Presentational only. */
export function InsightCard({
  label,
  value,
  helperText,
  tone = 'flat',
  progressPercent,
  children,
  icon,
  iconTone = 'primary',
  wide = false,
}: InsightCardProps) {
  return (
    <div className={`rounded-xl border border-border bg-surface p-3.5 ${wide ? 'col-span-2' : ''}`}>
      <div className="flex items-center gap-2">
        {icon && (
          <span
            aria-hidden="true"
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${ICON_TONE_CLASSES[iconTone]}`}
          >
            {icon}
          </span>
        )}
        <p className="text-xs font-medium text-muted">{label}</p>
      </div>
      <p className="mt-1.5 line-clamp-2 break-words text-lg font-semibold text-text">{value}</p>
      {helperText && (
        <p className={`mt-1 text-xs font-medium ${TONE_CLASSES[tone]}`}>{helperText}</p>
      )}
      {typeof progressPercent === 'number' && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className={`h-full rounded-full ${PROGRESS_BAR_CLASSES[tone]}`}
            style={{ width: `${String(Math.min(100, Math.max(0, progressPercent)))}%` }}
          />
        </div>
      )}
      {children}
    </div>
  )
}
