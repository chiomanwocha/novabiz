import type { HTMLAttributes } from 'react'

export type CardProps = HTMLAttributes<HTMLDivElement>

// Flat, not shadowed — a border is enough to read as a raised surface against --color-bg,
// and it reads calmer/more deliberate than a shadow on every single card on the page.
/** A plain surface container — the balance summary, feed rows, and step panels all sit on one of these. */
export function Card({ className, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-4 ${className ?? ''}`}
      {...rest}
    />
  )
}
