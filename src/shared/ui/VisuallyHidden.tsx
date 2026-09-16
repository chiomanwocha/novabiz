import type { ReactNode } from 'react'

export interface VisuallyHiddenProps {
  children: ReactNode
}

/** Hides content visually while keeping it available to screen readers (the standard "sr-only" pattern). */
export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return (
    <span className="absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]">
      {children}
    </span>
  )
}
