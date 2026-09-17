import { assertNever } from '../../../lib/assertNever'
import { sendMoneyCopy } from '../copy'

/**
 * What the caller found out before calling `reconcile` — never a raw `ApiError`, so this
 * stays a plain data-in/data-out function with no knowledge of `fetch` or `ApiError` itself.
 * The hook is responsible for turning a real failed `POST /api/transfers` (and, if needed,
 * a follow-up `GET /api/transfers/:key`) into one of these before calling `reconcile`.
 */
export type ReconcileInput =
  | { kind: 'http'; message: string }
  | { kind: 'statusConfirmedSuccess' }
  | { kind: 'statusConfirmedFailure'; message: string | undefined }
  | { kind: 'statusNotFound' }
  | { kind: 'statusCheckFailed' }

export type ReconcileAction =
  | { kind: 'keep' }
  | { kind: 'restore'; message: string }
  | { kind: 'restoreUnconfirmed'; message: string }

/**
 * CLAUDE.md 6.4's reconciliation table, as pure branching logic:
 * - `http` (a definite failure — a real 4xx/5xx response to the transfer itself): always restore.
 * - `statusConfirmedSuccess` (a timeout/network error, but the status check found it went
 *   through): keep the optimistic state — it was right all along.
 * - `statusConfirmedFailure` / `statusNotFound` (the status check came back negative):
 *   restore — nothing was actually applied.
 * - `statusCheckFailed` (couldn't even find out what happened): restore, but mark it
 *   "unconfirmed" rather than "failed" — the truth is genuinely unknown, and `onSettled`'s
 *   refetch is what will actually settle it, not this function guessing.
 */
export function reconcile(input: ReconcileInput): ReconcileAction {
  switch (input.kind) {
    case 'http':
      return { kind: 'restore', message: input.message }
    case 'statusConfirmedSuccess':
      return { kind: 'keep' }
    case 'statusConfirmedFailure':
      return {
        kind: 'restore',
        message: input.message ?? sendMoneyCopy.confirm.genericFailureMessage,
      }
    case 'statusNotFound':
      return { kind: 'restore', message: sendMoneyCopy.confirm.genericFailureMessage }
    case 'statusCheckFailed':
      return { kind: 'restoreUnconfirmed', message: sendMoneyCopy.confirm.unconfirmedMessage }
    default:
      return assertNever(input)
  }
}
