import { useEffect, useRef, useState } from 'react'

import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'

import { SendMoneyStepper, type Step } from './components/SendMoneyStepper'
import { StatusAnnouncer } from './components/StatusAnnouncer'
import { StepContextPanel } from './components/StepContextPanel'
import { StepHeading } from './components/StepHeading'
import { sendMoneyCopy } from './copy'
import { AmountStep, type AmountDraft } from './steps/AmountStep'
import { RecipientStep, type RecipientDraft } from './steps/RecipientStep'

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
 * status region. RecipientStep (CP-16) and AmountStep (CP-17) are real steps, each with
 * its own gated Next button. ReviewStep/ConfirmStep (CP-18) are still placeholders behind
 * generic Back/Next controls until they replace this with real, self-gated forms. Neither
 * resolved recipient nor resolved amount is threaded into further steps yet — that lands
 * in CP-18, once ReviewStep actually has something to show for it. Each step's *draft* is
 * lifted here so Back doesn't reset it — the step itself still owns its own form state,
 * it's just seeded from and reported up to its draft.
 */
export function SendMoneyPage() {
  const [stepId, setStepId] = useState<StepId>('recipient')
  const [recipientDraft, setRecipientDraft] = useState<RecipientDraft>(EMPTY_RECIPIENT_DRAFT)
  const [amountDraft, setAmountDraft] = useState<AmountDraft>(EMPTY_AMOUNT_DRAFT)
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
              onNext={() => {
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
              onNext={() => {
                setStepId(nextStepId(stepId))
              }}
            />
          )}
          {(stepId === 'review' || stepId === 'confirm') && (
            <Card className="flex flex-col gap-4">
              <StatusAnnouncer message={null} />
              <p className="text-muted">{sendMoneyCopy.stepPlaceholders[stepId]}</p>
              <div className="flex justify-between">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStepId(previousStepId(stepId))
                  }}
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    setStepId(nextStepId(stepId))
                  }}
                  disabled={stepId === 'confirm'}
                >
                  Next
                </Button>
              </div>
            </Card>
          )}
        </div>
        <StepContextPanel {...sendMoneyCopy.stepContext[stepId]} />
      </div>
    </div>
  )
}
