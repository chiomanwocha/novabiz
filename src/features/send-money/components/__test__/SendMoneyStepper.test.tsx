import { render, screen } from '@testing-library/react'

import { SendMoneyStepper, type Step } from '../SendMoneyStepper'

const STEPS: readonly Step[] = [
  { id: 'recipient', label: 'Recipient' },
  { id: 'amount', label: 'Amount' },
  { id: 'review', label: 'Review' },
  { id: 'confirm', label: 'Confirm' },
]

describe('SendMoneyStepper', () => {
  it('marks the current step with aria-current="step", not colour alone', () => {
    render(<SendMoneyStepper steps={STEPS} currentStepId="amount" />)
    expect(screen.getByText('2')).toHaveAttribute('aria-current', 'step')
  })

  it('lists every step label', () => {
    render(<SendMoneyStepper steps={STEPS} currentStepId="recipient" />)
    for (const step of STEPS) {
      expect(screen.getByText(step.label)).toBeInTheDocument()
    }
  })
})
