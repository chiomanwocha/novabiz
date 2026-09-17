import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useRef } from 'react'

import { formatCount } from '../../../lib/format'
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
  /** See BalanceSummary's hide-balance toggle — masks every row's amount together with it. */
  isAmountVisible?: boolean
}

/**
 * An infinite, virtualised list: only the rows near the viewport are ever in the DOM,
 * however many pages have been fetched — the next page loads automatically as the last
 * rendered row comes into view.
 */
export function TransactionFeed({ filters = {}, isAmountVisible = true }: TransactionFeedProps) {
  const query = useTransactions(filters)
  const retry = useRetry(query)
  const parentRef = useRef<HTMLDivElement>(null)
  const transactions = query.data?.pages.flatMap((page) => page.transactions) ?? []
  const hasNextPage = query.hasNextPage
  // Every page carries the same total (it's the count of all filter-matching transactions,
  // not the page size), so the first page's value is as current as any other's.
  const total = query.data?.pages[0]?.total

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
      <div className="flex items-baseline justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-text">Transactions</h2>
        {query.isSuccess && total !== undefined && (
          <span className="text-sm text-muted">
            {formatCount(transactions.length)} of {formatCount(total)}
          </span>
        )}
      </div>
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
          <div
            ref={parentRef}
            // Scrolling still works via wheel/touch/keyboard — only the visible scrollbar
            // track is suppressed, across the three engines that need separate rules for it.
            className="h-120 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Transactions"
          >
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
                      <TransactionRow transaction={transaction} isAmountVisible={isAmountVisible} />
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
