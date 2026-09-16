import { maskAccountNumber } from '../../../lib/mask'

export interface ResolvedNameCardProps {
  accountName: string
  bankName: string
  accountNumber: string
}

/** The resolved name is untrusted (CLAUDE.md 6.3) — rendered as plain JSX text, never dangerouslySetInnerHTML. */
export function ResolvedNameCard({ accountName, bankName, accountNumber }: ResolvedNameCardProps) {
  return (
    <div className="rounded-md border border-success/30 bg-success/5 p-3">
      <p className="text-base font-bold text-text">{accountName}</p>
      <p className="text-sm text-muted">
        {bankName} · {maskAccountNumber(accountNumber)}
      </p>
    </div>
  )
}
