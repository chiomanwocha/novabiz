export interface Step {
  id: string
  label: string
}

export interface SendMoneyStepperProps {
  steps: readonly Step[]
  currentStepId: string
}

/** A visual progress indicator — text + colour, so which step is current is never colour alone. */
export function SendMoneyStepper({ steps, currentStepId }: SendMoneyStepperProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStepId)

  return (
    <ol className="flex items-center gap-4" aria-label="Send Money steps">
      {steps.map((step, index) => {
        const isCurrent = step.id === currentStepId
        const isDone = index < currentIndex

        return (
          <li key={step.id} className="flex items-center gap-2">
            <span
              aria-current={isCurrent ? 'step' : undefined}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                isCurrent
                  ? 'bg-accent text-primary'
                  : isDone
                    ? 'bg-success text-white'
                    : 'bg-muted/20 text-muted'
              }`}
            >
              {index + 1}
            </span>
            <span className={`text-sm ${isCurrent ? 'font-semibold text-text' : 'text-muted'}`}>
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
