import { forwardRef, type ReactNode } from 'react'

export interface StepHeadingProps {
  children: ReactNode
}

/**
 * `tabIndex={-1}` makes this focusable only via script, not Tab — SendMoneyPage focuses it
 * on every step change, so keyboard and screen-reader users land on the new step's heading
 * instead of staying wherever their focus happened to be (CLAUDE.md 6.4).
 */
export const StepHeading = forwardRef<HTMLHeadingElement, StepHeadingProps>(function StepHeading(
  { children },
  ref,
) {
  return (
    <h2
      ref={ref}
      tabIndex={-1}
      className="text-2xl font-bold tracking-tight text-text outline-none"
    >
      {children}
    </h2>
  )
})
