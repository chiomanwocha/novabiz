import { useEffect, useRef, useState } from 'react'

import { Button } from '../../shared/ui/Button'

import { SendMoneyStepper, type Step } from './components/SendMoneyStepper'
import { StatusAnnouncer } from './components/StatusAnnouncer'
import { StepHeading } from './components/StepHeading'
import { sendMoneyCopy } from './copy'
import { RecipientStep } from './steps/RecipientStep'

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

/**
 * The Send Money flow's shell: the stepper, the focused step heading, and the shared
 * status region. RecipientStep (CP-16) is the first real step, with its own gated Next
 * button. AmountStep (CP-17) and ReviewStep/ConfirmStep (CP-18) are still placeholders
 * behind generic Back/Next controls until they replace this with real, self-gated forms.
 * The resolved recipient isn't threaded into further steps yet — that lands in CP-18,
 * once ReviewStep actually has something to show for it.
 */
export function SendMoneyPage() {
  const [stepId, setStepId] = useState<StepId>('recipient')
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [stepId])

  return (
    <div className="flex flex-col gap-4">
      <SendMoneyStepper steps={STEPS} currentStepId={stepId} />
      <StepHeading ref={headingRef}>{sendMoneyCopy.stepTitles[stepId]}</StepHeading>
      {stepId === 'recipient' ? (
        <RecipientStep
          onNext={() => {
            setStepId(nextStepId(stepId))
          }}
        />
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
