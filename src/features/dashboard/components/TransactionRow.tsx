import { memo } from 'react'

import type { TransactionDto, TransactionStatus } from '../../../api/types'
import { formatKobo } from '../../../lib/money'
import { Badge, type BadgeTone } from '../../../shared/ui/Badge'
import { dashboardCopy } from '../copy'

export interface TransactionRowProps {
  transaction: TransactionDto
  /** Mirrors BalanceSummary's hide-balance toggle so amounts in the feed mask together with
   * every other figure on the dashboard. Defaults true so existing callers/stories are unaffected. */
  isAmountVisible?: boolean
}

const STATUS_TONE: Record<TransactionStatus, BadgeTone> = {
  successful: 'success',
  failed: 'danger',
  pending: 'warning',
}

const STATUS_LABEL: Record<TransactionStatus, string> = {
  successful: 'Successful',
  failed: 'Failed',
  pending: 'Pending',
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-NG', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

function TransactionRowComponent({ transaction, isAmountVisible = true }: TransactionRowProps) {
  const isCredit = transaction.type === 'credit'

  return (
    <div className="flex h-full items-center justify-between gap-3 border-b border-border px-1 transition hover:bg-text/5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          aria-hidden="true"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${
            isCredit ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'
          }`}
        >
          {isCredit ? '↓' : '↑'}
        </span>
        <div className="min-w-0">
          {/* Both fields come from the untrusted mock feed (CLAUDE.md 6.2's hostile descriptions) —
              rendered as plain JSX text, never dangerouslySetInnerHTML, so a value like
              `<img src=x onerror=alert(1)>` shows up as that literal string, not a real element. */}
          <p className="truncate text-sm font-medium text-text">{transaction.counterpartyName}</p>
          <p className="truncate text-xs text-muted">{transaction.description}</p>
        </div>
      </div>
      {/*
        Regression case: the badge and full date used to sit on one line here, `shrink-0` so
        this whole column always kept its full natural width no matter what — on a 360px
        screen, that left the counterparty name/description column (the only side actually
        allowed to shrink) squeezed down to zero width, hiding it entirely rather than just
        truncating it. Stacking the badge and date onto their own lines below `sm` makes this
        column's own widest line much narrower there, leaving real width for the
        name/description again. Reverting to the original single inline line from `sm` up
        matters just as much: applying the narrow-screen fix unconditionally made the desktop
        layout look cramped and stacked for no reason, when the width squeeze it exists to
        solve never happens there.
      */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={`text-sm font-semibold ${isCredit ? 'text-success' : 'text-danger'}`}>
          {isAmountVisible ? (
            <>
              {isCredit ? '+' : '-'}
              {formatKobo(transaction.amountKobo)}
            </>
          ) : (
            dashboardCopy.maskedFigure
          )}
        </span>
        <div className="flex flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-2">
          <Badge tone={STATUS_TONE[transaction.status]}>{STATUS_LABEL[transaction.status]}</Badge>
          <span className="whitespace-nowrap text-xs text-muted">
            {dateTimeFormatter.format(new Date(transaction.occurredAt))}
          </span>
        </div>
      </div>
    </div>
  )
}

/** Memo'd — the feed re-renders on every scroll frame, and props are stable per transaction id. */
export const TransactionRow = memo(TransactionRowComponent)
