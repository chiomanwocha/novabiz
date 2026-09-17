/**
 * Live "format as you type" for the Amount field: strips anything that isn't a digit or a
 * decimal point (so letters/symbols never persist), caps the decimal part at 2 digits
 * (matching the precision `parseNairaToKobo` actually supports), and groups the integer part
 * with thousands commas — typing "50000" shows "50,000" as it's typed. This is a display
 * transform only; `parseNairaToKobo` (never this) is still what turns the result into kobo.
 */
export function formatAmountInputValue(raw: string): string {
  const digitsAndDot = raw.replace(/[^\d.]/g, '')
  const firstDotIndex = digitsAndDot.indexOf('.')
  const hasDot = firstDotIndex !== -1
  const integerPart = hasDot ? digitsAndDot.slice(0, firstDotIndex) : digitsAndDot
  const decimalPart = hasDot
    ? digitsAndDot
        .slice(firstDotIndex + 1)
        .replace(/\./g, '')
        .slice(0, 2)
    : ''
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return hasDot ? `${groupedInteger}.${decimalPart}` : groupedInteger
}

/** How many digit/decimal-point characters (i.e. not comma "furniture") sit before `position`. */
export function countMeaningfulCharsBefore(value: string, position: number): number {
  return value.slice(0, Math.max(0, position)).replace(/[^\d.]/g, '').length
}

/**
 * The reverse of `countMeaningfulCharsBefore`: where the cursor should land in a re-formatted
 * value so it stays after the same digit/decimal-point characters as before — otherwise every
 * inserted comma would shove the cursor to the end of the field while typing in the middle.
 */
export function positionAfterMeaningfulChars(value: string, count: number): number {
  if (count <= 0) {
    return 0
  }
  let seen = 0
  for (let index = 0; index < value.length; index += 1) {
    if (/[\d.]/.test(value.charAt(index))) {
      seen += 1
      if (seen >= count) {
        return index + 1
      }
    }
  }
  return value.length
}
