import { render, screen } from '@testing-library/react'
import { createRef } from 'react'

import { StepHeading } from '../StepHeading'

describe('StepHeading', () => {
  it('renders as a heading with tabIndex -1, so it can receive focus programmatically', () => {
    const ref = createRef<HTMLHeadingElement>()
    render(<StepHeading ref={ref}>Who are you sending to?</StepHeading>)

    const heading = screen.getByRole('heading', { name: 'Who are you sending to?' })
    expect(heading).toHaveAttribute('tabindex', '-1')
    expect(ref.current).toBe(heading)
  })
})
