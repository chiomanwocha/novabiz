import { useEffect, useRef, useState } from 'react'

import { SendMoneyStepper, type Step } from './components/SendMoneyStepper'
import { StepContextPanel } from './components/StepContextPanel'
import { StepHeading } from './components/StepHeading'
import { sendMoneyCopy } from './copy'
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

/**
 * The Send Money flow's shell: the stepper, the focused step heading, and the shared
 * status region. All four steps are real now. Each step's *draft* (Recipient, Amount) is
 * lifted here so Back doesn't reset it — the step itself still owns its own form state,
 * it's just seeded from and reported up to its draft. The *resolved* recipient and amount
 * are lifted here too, once each step's Next actually produces one, since Review and
 * Confirm both need them. The idempotency key itself (`useIdempotencyKey`, built and
 * tested this checkpoint) isn't wired in here yet — there's nothing to send it with until
 * CP-19's real `useSendMoney` mutation exists to attach it to as a header.
 */
export function SendMoneyPage() {
  const [stepId, setStepId] = useState<StepId>('recipient')
  const [recipientDraft, setRecipientDraft] = useState<RecipientDraft>(EMPTY_RECIPIENT_DRAFT)
  const [amountDraft, setAmountDraft] = useState<AmountDraft>(EMPTY_AMOUNT_DRAFT)
  const [resolvedRecipient, setResolvedRecipient] = useState<ResolvedRecipient | null>(null)
  const [resolvedAmount, setResolvedAmount] = useState<ResolvedAmount | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

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
