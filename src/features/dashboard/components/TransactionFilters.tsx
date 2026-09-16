import { useState, type ChangeEvent, type SubmitEvent } from 'react'

import type { TransactionStatus, TransactionType } from '../../../api/types'
import { Input } from '../../../shared/ui/Input'
import { Select } from '../../../shared/ui/Select'
import type { TransactionFilters as TransactionFiltersValue } from '../hooks/useTransactions'

export interface TransactionFiltersProps {
  value: TransactionFiltersValue
  onChange: (next: TransactionFiltersValue) => void
}

const STATUS_OPTIONS = [
  { value: 'successful', label: 'Successful' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
]

const TYPE_OPTIONS = [
  { value: 'credit', label: 'Money in' },
  { value: 'debit', label: 'Money out' },
]

/**
 * Filters and search apply immediately, except search text, which applies on blur/submit
 * rather than every keystroke — fewer requests on the patchy, expensive data this app's
 * users are on. Browser find can't see virtualised rows, which is why a search box exists
 * at all (a logged trade-off, CLAUDE.md 6.5).
 */
export function TransactionFilters({ value, onChange }: TransactionFiltersProps) {
  const [searchText, setSearchText] = useState(value.q ?? '')

  function applySearch(): void {
    onChange({ ...value, q: searchText.trim() || null })
  }

  function handleSearchSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault()
    applySearch()
  }

  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>): void {
    const raw = event.target.value
    onChange({ ...value, status: (raw || null) as TransactionStatus | null })
  }

  function handleTypeChange(event: ChangeEvent<HTMLSelectElement>): void {
    const raw = event.target.value
    onChange({ ...value, type: (raw || null) as TransactionType | null })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <form onSubmit={handleSearchSubmit} className="min-w-40 flex-1">
        <Input
          label="Search"
          type="search"
          value={searchText}
          onChange={(event) => {
            setSearchText(event.target.value)
          }}
          onBlur={applySearch}
          hint="Search by who paid or the description"
        />
      </form>
      <Select
        label="Status"
        options={STATUS_OPTIONS}
        placeholder="All statuses"
        value={value.status ?? ''}
        onChange={handleStatusChange}
      />
      <Select
        label="Type"
        options={TYPE_OPTIONS}
        placeholder="All types"
        value={value.type ?? ''}
        onChange={handleTypeChange}
      />
      <Input
        label="From"
        type="date"
        value={value.from ?? ''}
        onChange={(event) => {
          onChange({ ...value, from: event.target.value || null })
        }}
      />
      <Input
        label="To"
        type="date"
        value={value.to ?? ''}
        onChange={(event) => {
          onChange({ ...value, to: event.target.value || null })
        }}
      />
    </div>
  )
}
