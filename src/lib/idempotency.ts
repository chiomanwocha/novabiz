/**
 * One key per transfer attempt (created when the user reaches the Review step, and
 * reused on retry — never regenerated for the same attempt). Sent as the
 * `Idempotency-Key` header on every `POST /api/transfers` request.
 */
export function createIdempotencyKey(): string {
  return crypto.randomUUID()
}
