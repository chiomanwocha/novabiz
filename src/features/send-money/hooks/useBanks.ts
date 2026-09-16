import { useQuery } from '@tanstack/react-query'

import { getBanks } from '../../../api/endpoints/banks'

/** The bank list barely changes — cached indefinitely, per CLAUDE.md 6.2's "staleTime: Infinity". */
export function useBanks() {
  return useQuery({
    queryKey: ['banks'],
    queryFn: getBanks,
    staleTime: Infinity,
  })
}
