import { useSearchParams } from 'react-router-dom'

import type { TransactionStatus, TransactionType } from '../../../api/types'

import type { TransactionFilters } from './useTransactions'

const STATUSES: readonly TransactionStatus[] = ['pending', 'successful', 'failed']
const TYPES: readonly TransactionType[] = ['credit', 'debit']

function parseStatus(value: string | null): TransactionStatus | null {
  return STATUSES.includes(value as TransactionStatus) ? (value as TransactionStatus) : null
}

function parseType(value: string | null): TransactionType | null {
  return TYPES.includes(value as TransactionType) ? (value as TransactionType) : null
}

export interface UseTransactionFilterParamsResult {
  filters: TransactionFilters
  setFilters: (next: TransactionFilters) => void
}

/**
 * Keeps transaction filters and search in the URL, per CLAUDE.md 6.5 — never in component
 * state alone. Values that don't match a known status/type (a tampered or stale URL) are
 * dropped rather than sent to the API as-is.
 */
export function useTransactionFilterParams(): UseTransactionFilterParamsResult {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters: TransactionFilters = {
    from: searchParams.get('from'),
    to: searchParams.get('to'),
    status: parseStatus(searchParams.get('status')),
    type: parseType(searchParams.get('type')),
    q: searchParams.get('q'),
  }

  function setFilters(next: TransactionFilters): void {
    const params = new URLSearchParams()
    if (next.from) {
      params.set('from', next.from)
    }
    if (next.to) {
      params.set('to', next.to)
    }
    if (next.status) {
      params.set('status', next.status)
    }
    if (next.type) {
      params.set('type', next.type)
    }
    if (next.q) {
      params.set('q', next.q)
    }
    setSearchParams(params, { replace: true })
  }

  return { filters, setFilters }
}
