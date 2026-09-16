import { render } from '@testing-library/react'

import { Skeleton } from '../Skeleton'

describe('Skeleton', () => {
  it('is hidden from screen readers, since it carries no real information', () => {
    const { container } = render(<Skeleton className="h-4 w-24" />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
