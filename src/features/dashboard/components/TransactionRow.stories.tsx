import type { Meta, StoryObj } from '@storybook/react-vite'

import type { TransactionDto } from '../../../api/types'
import { toKobo } from '../../../lib/money'

import { TransactionRow } from './TransactionRow'

const meta: Meta<typeof TransactionRow> = {
  title: 'dashboard/TransactionRow',
  component: TransactionRow,
}

export default meta
type Story = StoryObj<typeof TransactionRow>

const BASE: TransactionDto = {
  id: 'txn-1',
  type: 'credit',
  status: 'successful',
  amountKobo: toKobo(2_000_000),
  counterpartyName: 'Chidi Eze',
  counterpartyAccountNumber: '0099887766',
  counterpartyBankCode: '058',
  counterpartyBankName: 'GTBank',
  description: 'Stock payment',
  occurredAt: new Date().toISOString(),
}

export const Credit: Story = { args: { transaction: BASE } }

export const Debit: Story = {
  args: {
    transaction: {
      ...BASE,
      id: 'txn-2',
      type: 'debit',
      counterpartyName: 'Ngozi Adeyemi',
      description: 'Supplier restock',
    },
  },
}

export const Pending: Story = {
  args: {
    transaction: { ...BASE, id: 'txn-3', type: 'debit', status: 'pending' },
  },
}

export const Failed: Story = {
  args: {
    transaction: { ...BASE, id: 'txn-4', type: 'debit', status: 'failed' },
  },
}

/**
 * The seeded feed deliberately includes hostile descriptions (CLAUDE.md 6.2) to prove they
 * render as literal text, never HTML — check the DOM in the Storybook canvas: there's no
 * real `<img>` or `<script>` element, just the tag characters as visible text.
 */
export const HostileDescription: Story = {
  args: {
    transaction: {
      ...BASE,
      id: 'txn-5',
      counterpartyName: '<b>Ade</b><img src=x onerror=alert(1)>',
      description: '<script>alert("x")</script>',
    },
  },
}
