/**
 * CBN NUBAN (Nigeria Uniform Bank Account Number) check-digit validation, in the
 * 6-character institution-code form: a commercial bank's 3-digit CBN code is prefixed
 * with "000" to make a 6-digit institution code, which combines with the 9-digit
 * account serial into a 15-digit sequence for the weighted checksum.
 *
 * Algorithm verified against two independently published worked examples before use
 * (see BUILD_LOG "Review this" for the sources and the cross-check):
 *   - bank 011, serial 000001457 -> check digit 9 -> account 0000014579
 *   - bank 058, serial 001656322 -> check digit 8 -> account 0016563228
 *
 * This is an early typo catcher, not the final authority — the mock name-enquiry
 * endpoint is the source of truth, and the server re-validates the check digit too.
 */

const NUBAN_WEIGHTS = [3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3] as const

export interface BankOption {
  code: string
  name: string
}

/** Strips everything but digits, e.g. a pasted "0123 456-789" -> "0123456789". */
export function sanitiseAccountInput(raw: string): string {
  return raw.replace(/\D/g, '')
}

/** True if `accountNumber` is exactly 10 digits. Doesn't check the check digit. */
export function isNubanFormat(accountNumber: string): boolean {
  return /^\d{10}$/.test(accountNumber)
}

/**
 * True if the 10th digit of `accountNumber` is the correct CBN check digit for the
 * given 3-digit `bankCode`. Returns false (never throws) for malformed input.
 */
export function isValidNubanCheckDigit(accountNumber: string, bankCode: string): boolean {
  if (!isNubanFormat(accountNumber) || !/^\d{3}$/.test(bankCode)) {
    return false
  }

  const serial = accountNumber.slice(0, 9)
  const digits = `000${bankCode}${serial}`.split('').map(Number)
  const sum = digits.reduce((total, digit, index) => total + digit * (NUBAN_WEIGHTS[index] ?? 0), 0)
  const expectedCheckDigit = (10 - (sum % 10)) % 10

  return expectedCheckDigit === Number(accountNumber.charAt(9))
}

/** Banks whose check digit matches `accountNumber` — shown first in BankSelect when no bank is chosen yet. */
export function suggestBanks(accountNumber: string, banks: readonly BankOption[]): BankOption[] {
  if (!isNubanFormat(accountNumber)) {
    return []
  }
  return banks.filter((bank) => isValidNubanCheckDigit(accountNumber, bank.code))
}
