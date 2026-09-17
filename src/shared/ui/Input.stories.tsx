import type { Meta, StoryObj } from '@storybook/react-vite'

import { Input } from './Input'

const meta: Meta<typeof Input> = {
  title: 'shared/ui/Input',
  component: Input,
  args: { label: 'Account number' },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = { args: { hint: '10-digit account number' } }

export const WithError: Story = {
  args: {
    defaultValue: '01020304',
    error: 'Enter all 10 digits',
  },
}

export const Disabled: Story = { args: { disabled: true, defaultValue: '0102030400' } }
