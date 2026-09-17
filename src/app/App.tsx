import { RouterProvider } from 'react-router-dom'

import { ErrorBoundary } from '../shared/layout/ErrorBoundary'

import { QueryProvider } from './providers/QueryProvider'
import { ThemeProvider } from './providers/ThemeProvider'
import { router } from './routes'

function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}

export default App
