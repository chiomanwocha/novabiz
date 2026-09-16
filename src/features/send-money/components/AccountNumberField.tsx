import type { ChangeEvent, ClipboardEvent } from 'react'

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
 * digits off, per CLAUDE.md 6.3.
 */
export function AccountNumberField({
  value,
  onChange,
  bankCode,
  bankName,
}: AccountNumberFieldProps) {
  const error = computeError(value, bankCode, bankName)

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    onChange(sanitiseAccountInput(event.target.value))
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>): void {
    event.preventDefault()
    onChange(sanitiseAccountInput(event.clipboardData.getData('text')))
  }

  return (
    <Input
      label="Account number"
      hint="10-digit account number"
      inputMode="numeric"
      autoComplete="off"
      value={value}
      onChange={handleChange}
      onPaste={handlePaste}
      error={error}
    />
  )
}
