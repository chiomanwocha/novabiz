import { render, screen } from '@testing-library/react'

import App from '../App'

describe('App', () => {
  it('renders the dashboard heading', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /novabiz merchant dashboard/i })).toBeInTheDocument()
  })
})
