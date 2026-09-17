import type { Meta, StoryObj } from '@storybook/react-vite'

import { ResolvedNameCard } from './ResolvedNameCard'

const meta: Meta<typeof ResolvedNameCard> = {
  title: 'send-money/ResolvedNameCard',
  component: ResolvedNameCard,
  args: {
    accountName: 'Ngozi Adeyemi',
    bankName: 'First Bank of Nigeria',
    accountNumber: '0102030400',
  },
}

export default meta
type Story = StoryObj<typeof ResolvedNameCard>

export const Default: Story = {}

/** A very long name (CLAUDE.md 6.3's "ends in 3333" case) — tests the 360px layout doesn't overflow. */
export const LongName: Story = {
  args: {
    accountName:
      'Chukwuemeka Ngozi Adaeze Oluwatobiloba Ibrahim Abdulrahman Nwachukwu-Okonkwo-Balogun-Adeyemi',
  },
}

/**
 * The resolved name is untrusted (CLAUDE.md 6.3) — rendered as plain text, never
 * `dangerouslySetInnerHTML`. Check the canvas: no real `<b>`/`<img>` element, just characters.
 */
export const HostileName: Story = {
  args: { accountName: '<b>Ade</b><img src=x onerror=alert(1)>' },
}
