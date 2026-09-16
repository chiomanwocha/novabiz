import { render, screen } from '@testing-library/react'

import { Badge } from '../Badge'

describe('Badge', () => {
  it('always renders its status as visible text, not colour alone', () => {
    render(<Badge tone="success">Successful</Badge>)
    expect(screen.getByText('Successful')).toBeInTheDocument()
  })

  it.each([
    ['success', 'Successful'],
    ['danger', 'Failed'],
    ['warning', 'Pending'],
    ['neutral', 'Unknown'],
  ] as const)('renders the %s tone with its text', (tone, text) => {
    render(<Badge tone={tone}>{text}</Badge>)
    expect(screen.getByText(text)).toBeInTheDocument()
  })
})
