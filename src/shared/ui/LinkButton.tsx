import { Link, type LinkProps } from 'react-router-dom'

import { BUTTON_BASE_CLASSES, BUTTON_VARIANT_CLASSES, type ButtonVariant } from './Button'

export interface LinkButtonProps extends LinkProps {
  variant?: ButtonVariant
}

/**
 * A route navigation styled like a Button. Real page navigation (e.g. the dashboard's "Send
 * Money" call to action) should be an `<a>` via react-router's `Link` rather than a `<button
 * onClick={navigate}>`, so browser features like open-in-new-tab keep working — this shares
 * Button's exact classes so the two are visually identical.
 */
export function LinkButton({ variant = 'primary', className, ...rest }: LinkButtonProps) {
  return (
    <Link
      className={`${BUTTON_BASE_CLASSES} ${BUTTON_VARIANT_CLASSES[variant]} ${className ?? ''}`}
      {...rest}
    />
  )
}
