import { QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'

import { createTestQueryClient } from './queryClient'

/**
 * Renders `ui` inside a fresh, retry-off QueryClientProvider and a MemoryRouter — the
 * standard wrapper for any component under test that calls a query hook or a router hook
 * (useSearchParams, etc.).
 */
export function renderWithQueryClient(
  ui: ReactElement,
  initialEntries: string[] = ['/'],
): RenderResult {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={createTestQueryClient()}>{ui}</QueryClientProvider>
    </MemoryRouter>,
  )
}
