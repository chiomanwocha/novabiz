import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'shared/ui/Button',
  component: Button,
  args: { children: 'Send money' },
}

export default meta
type Story = StoryObj<typeof Button>

/** The gold-filled variant — the main action on a screen, e.g. Send Money. */
export const Primary: Story = { args: { variant: 'primary' } }

/** The outlined navy variant — a secondary action, e.g. Back. */
export const Secondary: Story = { args: { variant: 'secondary', children: 'Back' } }

/** A destructive action, e.g. a future "cancel scheduled transfer" control. */
export const Danger: Story = { args: { variant: 'danger', children: 'Cancel' } }

export const Disabled: Story = { args: { variant: 'primary', disabled: true } }
