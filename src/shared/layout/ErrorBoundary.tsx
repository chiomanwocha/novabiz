import { Component, type ReactNode } from 'react'

import { ErrorFallback } from './ErrorFallback'

export interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * A last-resort catch-all for render errors outside the router (e.g. inside ThemeProvider or
 * QueryProvider) — React Router's own `errorElement` (see routes.tsx) already catches errors
 * thrown by routed pages, but only a real class component `componentDidCatch` can catch errors
 * thrown above that boundary. There's no hook equivalent for this in React yet.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback />
    }
    return this.props.children
  }
}
