export interface SpinnerProps {
  label?: string
}

/** An animated loading indicator, announced to screen readers via role="status". */
export function Spinner({ label = 'Loading…' }: SpinnerProps) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-muted">
      <svg
        aria-hidden="true"
        className="h-5 w-5 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
        />
      </svg>
      <span>{label}</span>
    </span>
  )
}
