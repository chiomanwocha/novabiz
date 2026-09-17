import type { Meta, StoryObj } from '@storybook/react-vite'

import { ErrorState } from './ErrorState'

const meta: Meta<typeof ErrorState> = {
  title: 'shared/ui/ErrorState',
  component: ErrorState,
  args: {
    message: "We couldn't load your balance and limits.",
    onRetry: () => {
      // Storybook-only no-op — the real Retry re-runs the failed query.
    },
  },
}

export default meta
type Story = StoryObj<typeof ErrorState>

/** Every fetching view's error state: a human message and a Retry button — CLAUDE.md 6.6. Never raw error text. */
export const Default: Story = {}
