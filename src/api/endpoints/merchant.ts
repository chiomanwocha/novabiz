import { apiRequest } from '../client'
import type { MerchantDto } from '../types'

export function getMerchant(): Promise<MerchantDto> {
  return apiRequest<MerchantDto>('/api/merchant')
}
