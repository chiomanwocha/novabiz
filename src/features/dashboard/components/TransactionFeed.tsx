import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useRef } from 'react'

import { useRetry } from '../../../shared/hooks/useRetry'
import { Card } from '../../../shared/ui/Card'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { Skeleton } from '../../../shared/ui/Skeleton'
import { Spinner } from '../../../shared/ui/Spinner'
import { VisuallyHidden } from '../../../shared/ui/VisuallyHidden'
import { dashboardCopy } from '../copy'
import { useTransactions, type TransactionFilters } from '../hooks/useTransactions'

import { TransactionRow } from './TransactionRow'

const ROW_HEIGHT_PX = 72

export interface TransactionFeedProps {
  filters?: TransactionFilters
}

/**
 * An infinite, virtualised list: only the rows near the viewport are ever in the DOM,
 * however many pages have been fetched — the next page loads automatically as the last
 * rendered row comes into view.
 */
export function TransactionFeed({ filters = {} }: TransactionFeedProps) {
  const query = useTransactions(filters)
  const retry = useRetry(query)
  const parentRef = useRef<HTMLDivElement>(null)
  const transactions = query.data?.pages.flatMap((page) => page.transactions) ?? []
  const hasNextPage = query.hasNextPage

  const virtualizer = useVirtualizer({
    count: hasNextPage ? transactions.length + 1 : transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: 8,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const lastVirtualItem = virtualItems[virtualItems.length - 1]

  useEffect(() => {
    if (!lastVirtualItem) {
      return
    }
    if (
      lastVirtualItem.index >= transactions.length - 1 &&
      hasNextPage &&
      !query.isFetchingNextPage
    ) {
      void query.fetchNextPage()
    }
  }, [lastVirtualItem, transactions.length, hasNextPage, query])

  return (
    <Card className="p-0">
      <h2 className="border-b border-border px-5 py-4 text-base font-semibold text-text">
        Transactions
      </h2>
      <div className="px-2 pb-2">
        {query.isPending && (
          <div aria-busy="true" className="flex flex-col gap-2 p-3">
            <VisuallyHidden>{dashboardCopy.feedLoadingLabel}</VisuallyHidden>
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        )}

        {query.isError && <ErrorState message={query.error.message} onRetry={retry} />}

        {query.isSuccess && transactions.length === 0 && (
          <EmptyState
            title={dashboardCopy.feedEmptyTitle}
            description={dashboardCopy.feedEmptyDescription}
          />
        )}

        {query.isSuccess && transactions.length > 0 && (
          <div ref={parentRef} className="h-120 overflow-y-auto" aria-label="Transactions">
            <ul className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
              {virtualItems.map((virtualItem) => {
                const transaction = transactions[virtualItem.index]
                return (
                  <li
                    key={virtualItem.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${String(virtualItem.size)}px`,
                      transform: `translateY(${String(virtualItem.start)}px)`,
                    }}
                  >
                    {transaction ? (
                      <TransactionRow transaction={transaction} />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Spinner label={dashboardCopy.feedLoadingMoreLabel} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </Card>
  )
}
