import { useQuery } from '@tanstack/react-query'

import { getMerchantInsights } from '../../../api/endpoints/insights'

export function useInsights() {
  return useQuery({
    queryKey: ['merchant', 'insights'],
    queryFn: getMerchantInsights,
  })
}
