import type { Kobo } from '../../../lib/money'

export interface WeekComparisonBarsProps {
  thisWeekKobo: Kobo
  lastWeekKobo: Kobo
}

/**
 * A small relative bar-per-week comparison — enough of a "chart" to make a trend scannable
 * at a glance without pulling in a charting library for two numbers.
 */
export function WeekComparisonBars({ thisWeekKobo, lastWeekKobo }: WeekComparisonBarsProps) {
  const max = Math.max(thisWeekKobo, lastWeekKobo, 1)
  const thisWeekPercent = Math.round((thisWeekKobo / max) * 100)
  const lastWeekPercent = Math.round((lastWeekKobo / max) * 100)

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="w-16 shrink-0 whitespace-nowrap text-[10px] font-medium text-muted">
          This week
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${String(thisWeekPercent)}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-16 shrink-0 whitespace-nowrap text-[10px] font-medium text-muted">
          Last week
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-muted"
            style={{ width: `${String(lastWeekPercent)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
