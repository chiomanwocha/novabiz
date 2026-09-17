import { useEffect, useRef, useState } from 'react'

import { SendMoneyStepper, type Step } from './components/SendMoneyStepper'
import { StepContextPanel } from './components/StepContextPanel'
import { StepHeading } from './components/StepHeading'
import { sendMoneyCopy } from './copy'
import { useIdempotencyKey } from './hooks/useIdempotencyKey'
import { useSendMoney } from './hooks/useSendMoney'
import { AmountStep, type AmountDraft, type ResolvedAmount } from './steps/AmountStep'
import { ConfirmStep } from './steps/ConfirmStep'
import { RecipientStep, type RecipientDraft, type ResolvedRecipient } from './steps/RecipientStep'
import { ReviewStep } from './steps/ReviewStep'

type StepId = 'recipient' | 'amount' | 'review' | 'confirm'

const STEP_ORDER: readonly StepId[] = ['recipient', 'amount', 'review', 'confirm']

const STEPS: readonly Step[] = STEP_ORDER.map((id) => ({
  id,
  label: sendMoneyCopy.stepLabels[id],
}))

function nextStepId(current: StepId): StepId {
  const index = STEP_ORDER.indexOf(current)
  return STEP_ORDER[index + 1] ?? current
}

function previousStepId(current: StepId): StepId {
  const index = STEP_ORDER.indexOf(current)
  return STEP_ORDER[index - 1] ?? current
}

const EMPTY_RECIPIENT_DRAFT: RecipientDraft = { bankCode: null, accountNumber: '' }
const EMPTY_AMOUNT_DRAFT: AmountDraft = { amountNaira: '', narration: '' }

/** A key that only changes when the resolved recipient or amount actually changes. */
function idempotencySignature(
  recipient: ResolvedRecipient | null,
  amount: ResolvedAmount | null,
): string {
  if (!recipient || !amount) {
    return ''
  }
  return `${recipient.bankCode}:${recipient.accountNumber}:${String(amount.amountKobo)}:${amount.narration}`
}

/**
 * The Send Money flow's shell: the stepper, the focused step heading, and the shared
 * status region. All four steps are real now. Each step's *draft* (Recipient, Amount) is
 * lifted here so Back doesn't reset it — the step itself still owns its own form state,
 * it's just seeded from and reported up to its draft. The *resolved* recipient and amount
 * are lifted here too, once each step's Next actually produces one, since Review and
 * Confirm both need them. The idempotency key is created here too — "the flow state" per
 * CLAUDE.md 6.4 — from a signature of the resolved recipient and amount, so it's stable
 * across a Back-then-Forward navigation and only changes when one of them really does.
 * `useSendMoney()` is lifted for the same reason: instantiated inside ConfirmStep, Back then
 * Forward would remount it and reset `status` to idle even while a send was still genuinely
 * in flight on the server.
 */
export function SendMoneyPage() {
  const [stepId, setStepId] = useState<StepId>('recipient')
  const [recipientDraft, setRecipientDraft] = useState<RecipientDraft>(EMPTY_RECIPIENT_DRAFT)
  const [amountDraft, setAmountDraft] = useState<AmountDraft>(EMPTY_AMOUNT_DRAFT)
  const [resolvedRecipient, setResolvedRecipient] = useState<ResolvedRecipient | null>(null)
  const [resolvedAmount, setResolvedAmount] = useState<ResolvedAmount | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const idempotencyKey = useIdempotencyKey(idempotencySignature(resolvedRecipient, resolvedAmount))
  const { send, status } = useSendMoney()

  useEffect(() => {
    headingRef.current?.focus()
  }, [stepId])

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold text-text">{sendMoneyCopy.pageTitle}</h1>
      <SendMoneyStepper steps={STEPS} currentStepId={stepId} />
      <StepHeading ref={headingRef}>{sendMoneyCopy.stepTitles[stepId]}</StepHeading>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="lg:flex-1">
          {stepId === 'recipient' && (
            <RecipientStep
              initialDraft={recipientDraft}
              onDraftChange={setRecipientDraft}
              onNext={(recipient) => {
                setResolvedRecipient(recipient)
                setStepId(nextStepId(stepId))
              }}
            />
          )}
          {stepId === 'amount' && (
            <AmountStep
              initialDraft={amountDraft}
              onDraftChange={setAmountDraft}
              onBack={() => {
                setStepId(previousStepId(stepId))
              }}
              onNext={(amount) => {
                setResolvedAmount(amount)
                setStepId(nextStepId(stepId))
              }}
            />
          )}
          {stepId === 'review' && resolvedRecipient && resolvedAmount && (
            <ReviewStep
              recipient={resolvedRecipient}
              amount={resolvedAmount}
              onBack={() => {
                setStepId(previousStepId(stepId))
              }}
              onNext={() => {
                setStepId(nextStepId(stepId))
              }}
            />
          )}
          {stepId === 'confirm' && resolvedRecipient && resolvedAmount && (
            <ConfirmStep
              recipient={resolvedRecipient}
              amount={resolvedAmount}
              idempotencyKey={idempotencyKey}
              send={send}
              status={status}
              onBack={() => {
                setStepId(previousStepId(stepId))
              }}
            />
          )}
        </div>
        <StepContextPanel {...sendMoneyCopy.stepContext[stepId]} />
      </div>
    </div>
  )
}
