import { memo } from 'react'

import type { TransactionDto, TransactionStatus } from '../../../api/types'
import { formatKobo } from '../../../lib/money'
import { Badge, type BadgeTone } from '../../../shared/ui/Badge'

export interface TransactionRowProps {
  transaction: TransactionDto
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

const timeFormatter = new Intl.DateTimeFormat('en-NG', { hour: 'numeric', minute: '2-digit' })

function TransactionRowComponent({ transaction }: TransactionRowProps) {
  const isCredit = transaction.type === 'credit'

  return (
    <div className="flex h-full items-center justify-between gap-3 border-b border-muted/10 px-1">
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className={`text-lg ${isCredit ? 'text-success' : 'text-text'}`}>
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
      <div className="flex flex-shrink-0 flex-col items-end gap-1">
        <span className={`text-sm font-semibold ${isCredit ? 'text-success' : 'text-text'}`}>
          {isCredit ? '+' : '-'}
          {formatKobo(transaction.amountKobo)}
        </span>
        <div className="flex items-center gap-2">
          <Badge tone={STATUS_TONE[transaction.status]}>{STATUS_LABEL[transaction.status]}</Badge>
          <span className="text-xs text-muted">
            {timeFormatter.format(new Date(transaction.occurredAt))}
          </span>
        </div>
      </div>
    </div>
  )
}

/** Memo'd — the feed re-renders on every scroll frame, and props are stable per transaction id. */
export const TransactionRow = memo(TransactionRowComponent)
