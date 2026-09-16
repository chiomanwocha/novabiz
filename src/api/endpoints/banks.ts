import { apiRequest } from '../client'
import type { BankDto } from '../types'

export function getBanks(): Promise<BankDto[]> {
  return apiRequest<BankDto[]>('/api/banks')
}
