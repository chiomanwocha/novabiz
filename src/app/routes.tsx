import { createBrowserRouter, Outlet } from 'react-router-dom'

import { DashboardPage } from '../features/dashboard/DashboardPage'
import { SendMoneyPage } from '../features/send-money/SendMoneyPage'
import { AppShell } from '../shared/layout/AppShell'
import { RouteErrorFallback } from '../shared/layout/RouteErrorFallback'

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
    errorElement: <RouteErrorFallback />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/send', element: <SendMoneyPage /> },
    ],
  },
])
