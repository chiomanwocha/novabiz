import { formatKobo } from '../../../lib/money'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { ResolvedNameCard } from '../components/ResolvedNameCard'
import { sendMoneyCopy } from '../copy'

import type { ResolvedAmount } from './AmountStep'
import type { ResolvedRecipient } from './RecipientStep'

export interface ReviewStepProps {
  recipient: ResolvedRecipient
  amount: ResolvedAmount
  onBack: () => void
  onNext: () => void
}

/**
 * A read-only summary of what Recipient and Amount resolved to. Nothing here is editable
 * directly — Back returns to Amount with both drafts intact (SendMoneyPage owns them), so
 * changing anything happens by going back and editing the real form, not a shortcut here.
 * The idempotency key itself isn't shown (it's internal plumbing for the eventual request,
 * not something a merchant needs to see) — it's created and held in SendMoneyPage's own
 * state, per CLAUDE.md 6.4.
 */
export function ReviewStep({ recipient, amount, onBack, onNext }: ReviewStepProps) {
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-text">{sendMoneyCopy.review.recipientHeading}</h2>
        <ResolvedNameCard
          accountName={recipient.accountName}
          bankName={recipient.bankName}
          accountNumber={recipient.accountNumber}
        />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-text">{sendMoneyCopy.review.amountHeading}</h2>
        <p className="text-2xl font-bold text-text">{formatKobo(amount.amountKobo)}</p>
        {amount.narration && (
          <p className="text-sm text-muted">
            {sendMoneyCopy.review.narrationLabel}: {amount.narration}
          </p>
        )}
      </div>
      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>{sendMoneyCopy.review.confirmButton}</Button>
      </div>
    </Card>
  )
}
