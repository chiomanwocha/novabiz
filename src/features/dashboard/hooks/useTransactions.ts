import { useInfiniteQuery } from '@tanstack/react-query'

import { getTransactions, type GetTransactionsParams } from '../../../api/endpoints/transactions'

export type TransactionFilters = Omit<GetTransactionsParams, 'cursor' | 'limit'>

/** Newest-first, cursor-paginated transaction pages — one page fetched per call to fetchNextPage. */
export function useTransactions(filters: TransactionFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['transactions', filters],
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      getTransactions({ ...filters, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}
