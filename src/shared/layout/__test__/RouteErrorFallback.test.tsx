import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

import { RouteErrorFallback } from '../RouteErrorFallback'

function renderWithRouterError(element: () => never) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <ThrowingElement run={element} />,
        errorElement: <RouteErrorFallback />,
      },
    ],
    { initialEntries: ['/'] },
  )
  return render(<RouterProvider router={router} />)
}

function ThrowingElement({ run }: { run: () => never }) {
  return run()
}

describe('RouteErrorFallback', () => {
  it("shows the thrown error's message when it is a real Error", () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    renderWithRouterError(() => {
      throw new Error('Could not resolve the send-money step')
    })

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Could not resolve the send-money step')).toBeInTheDocument()

    consoleErrorSpy.mockRestore()
  })
})
