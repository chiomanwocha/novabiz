import type { HTMLAttributes } from 'react'

export type SkeletonProps = HTMLAttributes<HTMLDivElement>

/** A decorative loading placeholder. Hidden from screen readers — the real loading state is announced elsewhere. */
export function Skeleton({ className, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-muted/20 ${className ?? ''}`}
      {...rest}
    />
  )
}
