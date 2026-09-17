import { CircleCheck, Send } from 'lucide-react'

import { maskAccountNumber } from '../../../lib/mask'
import { formatKobo } from '../../../lib/money'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { LinkButton } from '../../../shared/ui/LinkButton'
import { StatusAnnouncer } from '../components/StatusAnnouncer'
import { sendMoneyCopy } from '../copy'
import type { SendMoneyInput, SendMoneyStatus } from '../hooks/useSendMoney'

import type { ResolvedAmount } from './AmountStep'
import type { ResolvedRecipient } from './RecipientStep'

export interface ConfirmStepProps {
  recipient: ResolvedRecipient
  amount: ResolvedAmount
  idempotencyKey: string
  /**
   * `useSendMoney()` is instantiated by SendMoneyPage, not here, and passed down — this step
   * used to call the hook itself, which meant navigating Back then Forward remounted it and
   * reset `status` to idle even while a send was still genuinely in flight on the server.
   * Lifting it keeps one mutation instance alive for the whole flow, the same way the
   * resolved recipient/amount and idempotency key already are.
   */
  send: (input: SendMoneyInput) => void
  status: SendMoneyStatus
  onBack: () => void
}

/**
 * The Send button disables on the first press and never re-enables — CLAUDE.md 6.4 — so a
 * double-tap on a patchy connection can't fire two requests client-side (the idempotency
 * key is the real, server-enforced guarantee; this is the first line of defence). A failed
 * attempt shows a distinct "Try again" button instead of re-enabling the original one, and
 * reuses the exact same `idempotencyKey` prop — a genuine retry, not a new attempt.
 *
 * Content, not just colour, is what separates this from ReviewStep (they were reported as
 * reading like the same page twice): Review shows the full recap — a boxed ResolvedNameCard
 * plus a labelled amount — so a merchant can check every detail. This step doesn't repeat
 * that card; it asks a single confirmation question in prose and adds the one fact Review
 * doesn't state — that sending can't be undone — since that's the actual reason a separate
 * confirm step exists. Once the transfer lands (`status.state === 'sent'`), the whole card
 * swaps for a dedicated success view instead of just adding a message on top of the same
 * form — there's nothing left to review or confirm at that point, so Back/Send buttons no
 * longer make sense either.
 */
export function ConfirmStep({
  recipient,
  amount,
  idempotencyKey,
  send,
  status,
  onBack,
}: ConfirmStepProps) {
  function handleSend(): void {
    send({ idempotencyKey, recipient, amount })
  }

  if (status.state === 'sent') {
    return (
      <Card className="flex flex-col items-center gap-4 py-8 text-center">
        <span
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-success-bg text-success"
        >
          <CircleCheck aria-hidden="true" className="h-8 w-8" strokeWidth={2.5} />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-lg font-bold text-text">{sendMoneyCopy.confirm.successHeading}</p>
          <p className="text-sm text-muted">
            {formatKobo(amount.amountKobo)} to {recipient.accountName}
          </p>
        </div>
        <StatusAnnouncer
          message={sendMoneyCopy.confirm.successMessage}
          isError={false}
          visuallyHidden
        />
        <LinkButton to="/" className="mt-2">
          Back to dashboard
        </LinkButton>
      </Card>
    )
  }

  const canGoBack = status.state === 'idle' || status.state === 'failed'

  const statusMessage =
    status.state === 'sending'
      ? sendMoneyCopy.confirm.sendingMessage
      : status.state === 'failed' || status.state === 'unconfirmed'
        ? status.message
        : null

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Send aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          {sendMoneyCopy.confirm.panelHeading}
        </div>
        <p className="text-lg text-text">
          Send <span className="text-2xl font-bold">{formatKobo(amount.amountKobo)}</span> to{' '}
          <span className="font-bold">{recipient.accountName}</span>?
        </p>
        <p className="text-sm text-muted">
          {recipient.bankName} · {maskAccountNumber(recipient.accountNumber)}
        </p>
        <p className="text-sm font-medium text-warning">
          {sendMoneyCopy.confirm.irreversibleNotice}
        </p>
      </div>
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
