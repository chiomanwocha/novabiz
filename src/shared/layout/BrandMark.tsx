export interface BrandMarkProps {
  /** For placement on a navy surface (the sidebar) instead of the light header. */
  inverted?: boolean
}

/**
 * The NovaBiz wordmark and logo mark. The mark is a placeholder monogram, not the real
 * FirstBank elephant logo — swap in the real asset once available, same treatment as the
 * placeholder brand colours in theme/tokens.css.
 */
export function BrandMark({ inverted = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className={
          inverted
            ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-lg font-extrabold tracking-tight text-on-accent'
            : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-hover text-lg font-extrabold tracking-tight text-accent shadow-sm'
        }
      >
        N
      </span>
      <span
        className={`text-lg font-bold tracking-tight ${inverted ? 'text-white' : 'text-primary'}`}
      >
        NovaBiz
      </span>
    </div>
  )
}
