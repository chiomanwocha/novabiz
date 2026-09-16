import { QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'

import { createTestQueryClient } from './queryClient'

/** Renders `ui` inside a fresh, retry-off QueryClientProvider — the standard wrapper for any component under test that calls a query hook. */
export function renderWithQueryClient(ui: ReactElement): RenderResult {
  return render(<QueryClientProvider client={createTestQueryClient()}>{ui}</QueryClientProvider>)
}
