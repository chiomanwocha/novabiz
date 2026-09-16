import { apiRequest } from '../client'
import type { TransactionsPageDto, TransactionStatus, TransactionType } from '../types'

export interface GetTransactionsParams {
  cursor?: string | null
  limit?: number
  from?: string | null
  to?: string | null
  status?: TransactionStatus | null
  type?: TransactionType | null
  q?: string | null
}

export function getTransactions(params: GetTransactionsParams = {}): Promise<TransactionsPageDto> {
  const search = new URLSearchParams()
  if (params.cursor) search.set('cursor', params.cursor)
  if (params.limit) search.set('limit', String(params.limit))
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)
  if (params.status) search.set('status', params.status)
  if (params.type) search.set('type', params.type)
  if (params.q) search.set('q', params.q)

  const query = search.toString()
  return apiRequest<TransactionsPageDto>(query ? `/api/transactions?${query}` : '/api/transactions')
}
