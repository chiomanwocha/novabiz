import { useState, type ChangeEvent, type ClipboardEvent } from 'react'

import { isValidNubanCheckDigit, sanitiseAccountInput } from '../../../lib/nuban'
import { Input } from '../../../shared/ui/Input'

export interface AccountNumberFieldProps {
  value: string
  onChange: (nextValue: string) => void
  bankCode: string | null
  bankName: string | null
}

const ACCOUNT_NUMBER_LENGTH = 10

function computeError(
  value: string,
  bankCode: string | null,
  bankName: string | null,
): string | undefined {
  if (value.length === 0 || value.length === ACCOUNT_NUMBER_LENGTH) {
    if (
      value.length === ACCOUNT_NUMBER_LENGTH &&
      bankCode &&
      !isValidNubanCheckDigit(value, bankCode)
    ) {
      return `This account number doesn't look right for ${bankName ?? 'this bank'}. Please check it.`
    }
    return undefined
  }
  return 'Enter all 10 digits'
}

/**
 * Sanitises pasted input (strips spaces/dashes/etc.) but never silently truncates it —
 * more than 10 digits shows the "Enter all 10 digits" error instead of quietly cutting
 * digits off, per CLAUDE.md 6.3. Typing, unlike pasting, is capped at 10 characters via the
 * native `maxLength` — the browser simply stops accepting further keystrokes once at the
 * limit (this doesn't affect the paste path above, since that's applied programmatically
 * via React's controlled `value`, which `maxLength` doesn't enforce against).
 *
 * Validates on blur, not on every keystroke, matching how a traditional bank form behaves:
 * no error shows until the field has been left at least once, and typing again after that
 * first blur clears the stale error immediately rather than leaving it up while re-editing —
 * the next blur is what re-validates.
 */
export function AccountNumberField({
  value,
  onChange,
  bankCode,
  bankName,
}: AccountNumberFieldProps) {
  const [blurredError, setBlurredError] = useState<string | undefined>(undefined)

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    onChange(sanitiseAccountInput(event.target.value))
    setBlurredError(undefined)
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>): void {
    event.preventDefault()
    onChange(sanitiseAccountInput(event.clipboardData.getData('text')))
    setBlurredError(undefined)
  }

  function handleBlur(): void {
    setBlurredError(computeError(value, bankCode, bankName))
  }

  return (
    <Input
      label="Account number"
      hint="10-digit account number"
      inputMode="numeric"
      autoComplete="off"
      maxLength={10}
      value={value}
      onChange={handleChange}
      onPaste={handlePaste}
      onBlur={handleBlur}
      error={blurredError}
    />
  )
}
