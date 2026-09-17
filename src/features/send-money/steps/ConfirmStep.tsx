import { useState } from 'react'

import { formatKobo } from '../../../lib/money'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { ResolvedNameCard } from '../components/ResolvedNameCard'
import { StatusAnnouncer } from '../components/StatusAnnouncer'
import { sendMoneyCopy } from '../copy'

import type { ResolvedAmount } from './AmountStep'
import type { ResolvedRecipient } from './RecipientStep'

export interface ConfirmStepProps {
  recipient: ResolvedRecipient
  amount: ResolvedAmount
  onBack: () => void
}

/**
 * The Send button disables on the first press and stays disabled — CLAUDE.md 6.4, so a
 * double-tap on a patchy connection can never fire two requests from the client side alone
 * (the idempotency key is the real, server-enforced guarantee; this is the first line of
 * defence). There's genuinely nothing to send to yet: `useSendMoney` — the optimistic
 * update, rollback, and timeout reconciliation — is CP-19's scope, not this one's, so
 * pressing Send here only locks the button and says so, honestly, rather than pretending.
 */
export function ConfirmStep({ recipient, amount, onBack }: ConfirmStepProps) {
  const [hasPressedSend, setHasPressedSend] = useState(false)

  return (
    <Card className="flex flex-col gap-5">
      <ResolvedNameCard
        accountName={recipient.accountName}
        bankName={recipient.bankName}
        accountNumber={recipient.accountNumber}
      />
      <p className="text-2xl font-bold text-text">{formatKobo(amount.amountKobo)}</p>
      <StatusAnnouncer message={hasPressedSend ? sendMoneyCopy.confirm.notWiredUpYet : null} />
      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack} disabled={hasPressedSend}>
          Back
        </Button>
        <Button
          onClick={() => {
            setHasPressedSend(true)
          }}
          disabled={hasPressedSend}
        >
          {sendMoneyCopy.confirm.sendButton}
        </Button>
      </div>
    </Card>
  )
}
