import { createBrowserRouter, Outlet } from 'react-router-dom'

import { DashboardPage } from '../features/dashboard/DashboardPage'
import { AppShell } from '../shared/layout/AppShell'

// Placeholder until SendMoneyPage (CP-15) replaces it.
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
      { path: '/', element: <DashboardPage /> },
      { path: '/send', element: <SendMoneyPlaceholder /> },
    ],
  },
])
