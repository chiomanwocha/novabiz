/**
 * Money is always an integer number of kobo (1 Naira = 100 kobo). This file is the
 * only place that converts between kobo and Naira. Nothing outside it should do
 * arithmetic on a formatted Naira string or a floating-point Naira number.
 */

/** A whole number of kobo. Branded so a raw Naira number can't be passed where kobo is expected. */
export type Kobo = number & { readonly __brand: unique symbol }

/** Asserts `value` is a safe integer and brands it as Kobo. Call this at the API boundary. */
export function toKobo(value: number): Kobo {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Expected a safe integer kobo amount, got ${String(value)}`)
  }
  return value as Kobo
}

const currencyFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Formats kobo as Naira, e.g. `100050` -> `"₦1,000.50"`. Dividing by 100 here is safe
 * because it happens exactly once, at display time, and Intl rounds to 2dp — no money
 * arithmetic ever touches the result of this function.
 */
export function formatKobo(kobo: Kobo): string {
  return currencyFormatter.format(kobo / 100)
}

// Naira amount, optionally comma-grouped, with at most 2 decimal places. A leading dot
// (".5") is rejected — an amount always needs at least one digit before the decimal point.
const NAIRA_INPUT_PATTERN = /^\d{1,12}(\.\d{1,2})?$/

/**
 * Parses user-typed Naira input into kobo, or `null` if the input isn't a valid amount.
 * Never uses `parseFloat(x) * 100` — floating-point multiplication corrupts values like
 * `"1.13"` into `112.99999999999999`. Instead this splits on the decimal point and adds
 * the Naira and kobo parts as integers.
 */
export function parseNairaToKobo(input: string): Kobo | null {
  const cleaned = input.replace(/[,\s]/g, '')
  if (!NAIRA_INPUT_PATTERN.test(cleaned)) {
    return null
  }

  const [nairaPart = '', koboPart = ''] = cleaned.split('.')
  const kobo = Number(nairaPart) * 100 + Number(koboPart.padEnd(2, '0'))
  return toKobo(kobo)
}

/** Adds kobo values as integers. */
export function sumKobo(values: readonly Kobo[]): Kobo {
  return toKobo(values.reduce((total, value) => total + value, 0))
}
