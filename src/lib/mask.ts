/** Masks all but the last 4 digits of an account number, e.g. "0016563228" -> "******3228". */
export function maskAccountNumber(accountNumber: string): string {
  const visible = accountNumber.slice(-4)
  const hiddenCount = Math.max(accountNumber.length - visible.length, 0)
  return `${'*'.repeat(hiddenCount)}${visible}`
}
