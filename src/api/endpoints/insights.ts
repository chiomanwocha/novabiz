import { apiRequest } from '../client'
import type { MerchantInsightsDto } from '../types'

export function getMerchantInsights(): Promise<MerchantInsightsDto> {
  return apiRequest<MerchantInsightsDto>('/api/merchant/insights')
}
