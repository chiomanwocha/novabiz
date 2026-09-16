/** Cross-cutting timeouts, page sizes, and limits shared by the API client and the mock server. */

/** `AbortSignal.timeout()` duration for every request. The mock server's timeoutMode delays past this on purpose. */
export const REQUEST_TIMEOUT_MS = 10_000

/** How long a name-enquiry result stays valid before a transfer must re-confirm the recipient. */
export const NAME_ENQUIRY_VALID_MS = 10 * 60 * 1000

/** Transactions returned per page of the feed. */
export const TRANSACTIONS_PAGE_SIZE = 50

/** Default simulated network latency range, in milliseconds, when no `?latency=` override is set. */
export const DEFAULT_LATENCY_MIN_MS = 400
export const DEFAULT_LATENCY_MAX_MS = 1200
