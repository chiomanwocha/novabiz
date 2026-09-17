import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

import { ErrorFallback } from './ErrorFallback'

/** React Router wraps every route element in its own boundary and needs its error read out via
 * this hook rather than passed as a prop — `ErrorBoundary` (a plain React error boundary) can't
 * see these, since React Router catches them before they'd ever reach a componentDidCatch above it. */
export function RouteErrorFallback() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : undefined
  return <ErrorFallback message={message} />
}
