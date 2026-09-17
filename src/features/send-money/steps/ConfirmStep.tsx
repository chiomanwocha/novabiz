import { formatKobo } from '../../../lib/money'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { ResolvedNameCard } from '../components/ResolvedNameCard'
import { StatusAnnouncer } from '../components/StatusAnnouncer'
import { sendMoneyCopy } from '../copy'
import { useSendMoney } from '../hooks/useSendMoney'

import type { ResolvedAmount } from './AmountStep'
import type { ResolvedRecipient } from './RecipientStep'

export interface ConfirmStepProps {
  recipient: ResolvedRecipient
  amount: ResolvedAmount
  idempotencyKey: string
  onBack: () => void
}

/**
 * The Send button disables on the first press and never re-enables — CLAUDE.md 6.4 — so a
 * double-tap on a patchy connection can't fire two requests client-side (the idempotency
 * key is the real, server-enforced guarantee; this is the first line of defence). A failed
 * attempt shows a distinct "Try again" button instead of re-enabling the original one, and
 * reuses the exact same `idempotencyKey` prop — a genuine retry, not a new attempt.
 */
export function ConfirmStep({ recipient, amount, idempotencyKey, onBack }: ConfirmStepProps) {
  const { send, status } = useSendMoney()

  function handleSend(): void {
    send({ idempotencyKey, recipient, amount })
  }

  const canGoBack = status.state === 'idle' || status.state === 'failed'

  const statusMessage =
    status.state === 'sending'
      ? sendMoneyCopy.confirm.sendingMessage
      : status.state === 'sent'
        ? sendMoneyCopy.confirm.successMessage
        : status.state === 'failed' || status.state === 'unconfirmed'
          ? status.message
          : null

  return (
    <Card className="flex flex-col gap-5">
      <ResolvedNameCard
        accountName={recipient.accountName}
        bankName={recipient.bankName}
        accountNumber={recipient.accountNumber}
      />
      <p className="text-2xl font-bold text-text">{formatKobo(amount.amountKobo)}</p>
      <StatusAnnouncer message={statusMessage} isError={status.state === 'failed'} />
      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack} disabled={!canGoBack}>
          Back
        </Button>
        {status.state === 'failed' ? (
          <Button onClick={handleSend}>{sendMoneyCopy.confirm.retryButton}</Button>
        ) : (
          <Button onClick={handleSend} disabled={status.state !== 'idle'}>
            {sendMoneyCopy.confirm.sendButton}
          </Button>
        )}
      </div>
    </Card>
  )
}
