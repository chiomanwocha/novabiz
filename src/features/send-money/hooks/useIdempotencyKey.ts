import { useState } from 'react'

import { createIdempotencyKey } from '../../../lib/idempotency'

/**
 * One key per distinct `signature` — created fresh the first time a given signature is
 * seen, and stable across re-renders (including a Back-then-Forward navigation) as long
 * as the signature doesn't change. CLAUDE.md 6.4: "Going back and changing the recipient
 * or amount creates a new key." The signature is whatever the caller builds from the
 * fields that should invalidate a key when they change — typically the recipient's bank
 * and account number plus the amount and narration.
 *
 * Adjusts state during render rather than in a `useEffect`, so the new key is available
 * immediately on the render where the signature changes, not one render behind — the same
 * "derive from the current input, don't leave it to effect timing" approach `useNameEnquiry`
 * already uses (CLAUDE.md 6.3).
 */
export function useIdempotencyKey(signature: string): string {
  const [key, setKey] = useState(createIdempotencyKey)
  const [lastSignature, setLastSignature] = useState(signature)

  if (signature !== lastSignature) {
    setLastSignature(signature)
    setKey(createIdempotencyKey())
  }

  return key
}
