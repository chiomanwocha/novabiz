import { Search } from 'lucide-react'
import { useState, type ChangeEvent, type SubmitEvent } from 'react'

import type { TransactionStatus, TransactionType } from '../../../api/types'
import { DateRangeField } from '../../../shared/ui/DateRangeField'
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
 * No card wrapper — this is a toolbar above the feed, not a standalone panel. Search sits on
 * its own, wide, on the left; Status/Type/date-range form one cluster on the right —
 * `justify-between` is what puts real space between the two groups instead of them just
 * sitting side by side. `items-start` (not `items-end`) on both the outer row and the right
 * cluster is deliberate: Search has a hint line the other fields don't, so bottom-aligning
 * would visibly offset its input box from the others — aligning tops keeps every label and
 * input box level regardless of what sits underneath it. Filters (except search) apply
 * immediately, per CLAUDE.md 6.5; search text applies on blur/submit, not on every keystroke —
 * fewer requests on the patchy, expensive data this app's users are on. There's no standalone
 * "Clear filters" button: the search box clears itself (the trailing "x"), and Status/Type/date
 * range each clear back to "all" through their own control.
 */
export function TransactionFilters({ value, onChange }: TransactionFiltersProps) {
  const [searchText, setSearchText] = useState(value.q ?? '')

  function applySearch(): void {
    onChange({ ...value, q: searchText.trim() || null })
  }

  function clearSearch(): void {
    setSearchText('')
    onChange({ ...value, q: null })
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
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <form onSubmit={handleSearchSubmit} className="lg:w-80">
        <Input
          label="Search"
          // Not type="search" — that renders its own native clear "x" in Chrome/Edge/Safari
          // in addition to our themed one below, showing two. We already provide the clear
          // affordance ourselves (onClear), so a plain text field is the correct native type.
          type="text"
          icon={<Search aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />}
          value={searchText}
          onChange={(event) => {
            setSearchText(event.target.value)
          }}
          onBlur={applySearch}
          onClear={clearSearch}
          hint="Search by who paid or the description"
        />
      </form>
      <div className="flex flex-wrap items-start gap-3">
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          placeholder="All statuses"
          placeholderSelectable
          value={value.status ?? ''}
          onChange={handleStatusChange}
          className="min-w-36"
        />
        <Select
          label="Type"
          options={TYPE_OPTIONS}
          placeholder="All types"
          placeholderSelectable
          value={value.type ?? ''}
          onChange={handleTypeChange}
          className="min-w-32"
        />
        <DateRangeField
          label="Date range"
          fromValue={value.from ?? ''}
          toValue={value.to ?? ''}
          onRangeChange={(range) => {
            onChange({ ...value, from: range.from || null, to: range.to || null })
          }}
        />
      </div>
    </div>
  )
}
