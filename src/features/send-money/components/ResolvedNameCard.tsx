import { maskAccountNumber } from '../../../lib/mask'

export interface ResolvedNameCardProps {
  accountName: string
  bankName: string
  accountNumber: string
}

/** The resolved name is untrusted (CLAUDE.md 6.3) — rendered as plain JSX text, never dangerouslySetInnerHTML. */
export function ResolvedNameCard({ accountName, bankName, accountNumber }: ResolvedNameCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success-bg p-4">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success text-base text-white"
      >
        ✓
      </span>
      <div className="min-w-0">
        <p className="truncate text-base font-bold text-text">{accountName}</p>
        <p className="text-sm text-muted">
          {bankName} · {maskAccountNumber(accountNumber)}
        </p>
      </div>
    </div>
  )
}
