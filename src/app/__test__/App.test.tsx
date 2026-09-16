import { render, screen } from '@testing-library/react'

import App from '../App'

describe('App', () => {
  it('renders the app shell with the brand heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'NovaBiz' })).toBeInTheDocument()
  })
})
