import { delay, http } from 'msw'

import { TRANSACTIONS_PAGE_SIZE } from '../../config/constants'
import { randomLatencyMs, shouldSimulateFailure } from '../controls'
import { getTransactions } from '../db/store'
import type { Transaction, TransactionStatus, TransactionType } from '../db/types'

import { errorResponse, okResponse } from './envelope'

/**
 * `filters.from`/`filters.to` arrive as bare `YYYY-MM-DD` strings built from the *local*
 * calendar day the merchant picked (see `DateRangeField#toIsoDate`, which reads
 * `getFullYear`/`getMonth`/`getDate`). `new Date("YYYY-MM-DD")` instead parses a date-only
 * string as **UTC** midnight, not local midnight — a mismatch that made picking a single day
 * (from and to both that day) match almost nothing, since `to` capped the range at an instant
 * hours before the local day had even finished, while a wider range leaked in slivers of the
 * neighbouring day. Parsing with explicit Y/M/D components (local time, like `DateRangeField`
 * already does) instead of handing the raw string to `Date` keeps both sides using the same
 * definition of "day" — and `to` is end-of-day here, not start-of-day, since the whole
 * selected day should be included, not excluded.
 */
function startOfLocalDay(dateOnly: string): number {
  const [year, month, day] = dateOnly.split('-').map(Number)
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1, 0, 0, 0, 0).getTime()
}

function endOfLocalDay(dateOnly: string): number {
  const [year, month, day] = dateOnly.split('-').map(Number)
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1, 23, 59, 59, 999).getTime()
}

function matchesFilters(
  transaction: Transaction,
  filters: {
    from: string | null
    to: string | null
    status: string | null
    type: string | null
    q: string | null
  },
): boolean {
  const occurredAt = new Date(transaction.occurredAt).getTime()

  if (filters.from && occurredAt < startOfLocalDay(filters.from)) {
    return false
  }
  if (filters.to && occurredAt > endOfLocalDay(filters.to)) {
    return false
  }
  if (filters.status && transaction.status !== (filters.status as TransactionStatus)) {
    return false
  }
  if (filters.type && transaction.type !== (filters.type as TransactionType)) {
    return false
  }
  if (filters.q) {
    const needle = filters.q.toLowerCase()
    const haystack = `${transaction.counterpartyName} ${transaction.description}`.toLowerCase()
    if (!haystack.includes(needle)) {
      return false
    }
  }
  return true
}

function paginate(
  transactions: readonly Transaction[],
  cursor: string | null,
  limit: number,
): { page: Transaction[]; nextCursor: string | null } {
  const startIndex = cursor ? transactions.findIndex((t) => t.id === cursor) + 1 : 0
  const page = transactions.slice(startIndex, startIndex + limit)
  const isLastPage = startIndex + limit >= transactions.length
  const lastItem = page[page.length - 1]
  const nextCursor = isLastPage || !lastItem ? null : lastItem.id
  return { page, nextCursor }
}

export const transactionHandlers = [
  http.get('/api/transactions', async ({ request }) => {
    await delay(randomLatencyMs())

    if (shouldSimulateFailure()) {
      return errorResponse(500, 'Could not load transactions right now.')
    }

    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    const limit = Number(url.searchParams.get('limit')) || TRANSACTIONS_PAGE_SIZE
    const filters = {
      from: url.searchParams.get('from'),
      to: url.searchParams.get('to'),
      status: url.searchParams.get('status'),
      type: url.searchParams.get('type'),
      q: url.searchParams.get('q'),
    }

    const filtered = getTransactions().filter((transaction) => matchesFilters(transaction, filters))
    const { page, nextCursor } = paginate(filtered, cursor, limit)

    return okResponse({ transactions: page, nextCursor, total: filtered.length })
  }),
]
