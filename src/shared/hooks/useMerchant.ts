import { useQuery } from '@tanstack/react-query'

import { getMerchant } from '../../api/endpoints/merchant'

/**
 * Shared across features (dashboard's balance card, send-money's own-account check and
 * amount limits) — lives in shared/hooks/, not one feature's hooks/, per CLAUDE.md 3.2's
 * "features don't import from each other."
 */
export function useMerchant() {
  return useQuery({
    queryKey: ['merchant'],
    queryFn: getMerchant,
  })
}
