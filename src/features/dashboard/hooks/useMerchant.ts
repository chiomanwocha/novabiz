import { useQuery } from '@tanstack/react-query'

import { getMerchant } from '../../../api/endpoints/merchant'

export function useMerchant() {
  return useQuery({
    queryKey: ['merchant'],
    queryFn: getMerchant,
  })
}
