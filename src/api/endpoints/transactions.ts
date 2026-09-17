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

export type TransactionFilters = Omit<GetTransactionsParams, 'cursor' | 'limit'>

/**
 * Normalises any partial filters object (`{}`, or the full `{ from: null, to: null, ... }`
 * shape `useTransactionFilterParams` always returns) to the same canonical key — two callers
 * describing "no filters" differently used to produce two different TanStack Query cache
 * entries, so `useSendMoney`'s optimistic write silently landed on an entry nothing was
 * subscribed to and the dashboard only ever caught up via the slower onSettled refetch.
 */
export function transactionsQueryKey(filters: TransactionFilters = {}) {
  return [
    'transactions',
    {
      from: filters.from ?? null,
      to: filters.to ?? null,
      status: filters.status ?? null,
      type: filters.type ?? null,
      q: filters.q ?? null,
    },
  ] as const
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
