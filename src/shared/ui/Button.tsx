import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

// A thin outline still satisfies WCAG AA's "visible focus" requirement on its own; the
// added ring is purely a softer, glowier feel around it, not a replacement for it.
export const BUTTON_BASE_CLASSES =
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-4 text-base font-semibold transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:ring-4 focus-visible:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100'

export const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // text-on-accent (not text-primary) is deliberate: --color-primary shifts to a light
  // blue in dark mode for contrast elsewhere, but --color-accent (gold) never changes —
  // using text-primary here made this button render blue text on a still-gold background
  // in dark mode. --color-on-accent is fixed so this reads correctly in both themes.
  primary: 'bg-accent text-on-accent shadow-sm hover:bg-accent-hover',
  secondary:
    'border border-border bg-surface text-primary transition-colors hover:border-primary/30 hover:bg-surface-hover',
  danger: 'bg-danger text-white shadow-sm hover:brightness-95',
}

/** The Send Money button and other primary actions use the gold `primary` variant, per CLAUDE.md 6.8. */
export function Button({ variant = 'primary', className, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BUTTON_BASE_CLASSES} ${BUTTON_VARIANT_CLASSES[variant]} ${className ?? ''}`}
      {...rest}
    />
  )
}
