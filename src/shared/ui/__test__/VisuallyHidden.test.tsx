import { render, screen } from '@testing-library/react'

import { VisuallyHidden } from '../VisuallyHidden'

describe('VisuallyHidden', () => {
  it('keeps its content in the document and accessible to screen readers', () => {
    render(<VisuallyHidden>Transfer sent</VisuallyHidden>)
    expect(screen.getByText('Transfer sent')).toBeInTheDocument()
  })
})
