/** Exhaustiveness check for switch statements over a union — a compile error if a case is missing. */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`)
}
