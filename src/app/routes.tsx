import { createBrowserRouter, Outlet } from 'react-router-dom'

import { AppShell } from '../shared/layout/AppShell'

// Placeholders until DashboardPage (CP-12) and SendMoneyPage (CP-15) replace them.
function DashboardPlaceholder() {
  return <p className="text-muted">Dashboard coming in CP-12.</p>
}

function SendMoneyPlaceholder() {
  return <p className="text-muted">Send Money coming in CP-15.</p>
}

function RootLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <DashboardPlaceholder /> },
      { path: '/send', element: <SendMoneyPlaceholder /> },
    ],
  },
])
