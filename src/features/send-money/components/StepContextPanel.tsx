export interface StepContextPanelProps {
  heading: string
  points: readonly string[]
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="mt-0.5 h-4 w-4 shrink-0 text-success"
    >
      <path
        d="m5 13 4 4 10-10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
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
              <CheckIcon />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
