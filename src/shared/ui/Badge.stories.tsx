import type { Meta, StoryObj } from '@storybook/react-vite'

import { Badge } from './Badge'

const meta: Meta<typeof Badge> = {
  title: 'shared/ui/Badge',
  component: Badge,
}

export default meta
type Story = StoryObj<typeof Badge>

/** Status is always text + colour together, never colour alone — CLAUDE.md 6.7. */
export const Success: Story = { args: { tone: 'success', children: 'Successful' } }
export const Danger: Story = { args: { tone: 'danger', children: 'Failed' } }
export const Warning: Story = { args: { tone: 'warning', children: 'Pending' } }
export const Neutral: Story = { args: { tone: 'neutral', children: 'Tier 2' } }
