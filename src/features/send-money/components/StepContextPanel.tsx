import { Check } from 'lucide-react'

export interface StepContextPanelProps {
  heading: string
  points: readonly string[]
}

/**
 * Desktop-only companion beside a Send Money step's card — short, true-to-the-design context
 * ("why we ask", "what protects you here") so the wide desktop layout reads as a considered
 * page rather than a narrow mobile form stretched out with dead space. Purely decorative on
 * small screens, where it's hidden rather than squeezed in above/below the real form.
 */
export function StepContextPanel({ heading, points }: StepContextPanelProps) {
  return (
    <aside aria-label="About this step" className="hidden lg:block lg:w-72 lg:shrink-0">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-text">{heading}</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {points.map((point) => (
            <li key={point} className="flex gap-2 text-sm text-muted">
              <Check
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-success"
                strokeWidth={2}
              />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
