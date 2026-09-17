import type { HTMLAttributes } from 'react'

export type SkeletonProps = HTMLAttributes<HTMLDivElement>

/**
 * A decorative loading placeholder — a shimmering gradient sweep rather than a flat pulse,
 * closer to what a real fintech app's skeleton loaders look like. Hidden from screen readers;
 * the real loading state is announced elsewhere (e.g. VisuallyHidden text next to it).
 */
export function Skeleton({ className, style, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-shimmer rounded-lg bg-[linear-gradient(90deg,var(--color-border)_25%,var(--color-surface-hover)_50%,var(--color-border)_75%)] bg-[length:200%_100%] ${className ?? ''}`}
      style={style}
      {...rest}
    />
  )
}
