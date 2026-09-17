const countFormatter = new Intl.NumberFormat('en-NG')

/** Groups a plain count for display, e.g. `5000` → `"5,000"`. Never for money — see money.ts. */
export function formatCount(value: number): string {
  return countFormatter.format(value)
}
