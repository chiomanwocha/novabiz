import { LoaderCircle } from 'lucide-react'

export interface SpinnerProps {
  label?: string
}

/** An animated loading indicator, announced to screen readers via role="status". */
export function Spinner({ label = 'Loading…' }: SpinnerProps) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-muted">
      <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" strokeWidth={2.5} />
      <span>{label}</span>
    </span>
  )
}
