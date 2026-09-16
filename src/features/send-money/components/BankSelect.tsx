import type { BankDto } from '../../../api/types'
import { Select, type SelectOption } from '../../../shared/ui/Select'

export interface BankSelectProps {
  banks: readonly BankDto[]
  value: string
  onChange: (bankCode: string) => void
}

export function BankSelect({ banks, value, onChange }: BankSelectProps) {
  const options: SelectOption[] = banks.map((bank) => ({ value: bank.code, label: bank.name }))

  return (
    <Select
      label="Bank"
      options={options}
      placeholder="Choose a bank"
      value={value}
      onChange={(event) => {
        onChange(event.target.value)
      }}
    />
  )
}
