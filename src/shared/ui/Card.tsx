import type { HTMLAttributes } from 'react'

export type CardProps = HTMLAttributes<HTMLDivElement>

/** A plain surface container — the balance summary, feed rows, and step panels all sit on one of these. */
export function Card({ className, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-muted/20 bg-surface p-4 shadow-sm ${className ?? ''}`}
      {...rest}
    />
  )
}
