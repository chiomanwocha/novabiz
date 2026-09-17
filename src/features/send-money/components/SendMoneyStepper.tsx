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
    <ol className="flex items-center" aria-label="Send Money steps">
      {steps.map((step, index) => {
        const isCurrent = step.id === currentStepId
        const isDone = index < currentIndex

        return (
          <li key={step.id} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                aria-current={isCurrent ? 'step' : undefined}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                  isCurrent
                    ? 'bg-accent text-on-accent ring-4 ring-accent/25'
                    : isDone
                      ? 'bg-success text-white'
                      : 'bg-surface-hover text-muted'
                }`}
              >
                {isDone ? '✓' : index + 1}
              </span>
              <span
                className={`hidden text-xs sm:block ${isCurrent ? 'font-semibold text-text' : 'text-muted'}`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`mx-2 h-0.5 flex-1 rounded-full transition ${isDone ? 'bg-success' : 'bg-border'}`}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
