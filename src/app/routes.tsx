import { createBrowserRouter, Outlet } from 'react-router-dom'

import { DashboardPage } from '../features/dashboard/DashboardPage'
import { SendMoneyPage } from '../features/send-money/SendMoneyPage'
import { AppShell } from '../shared/layout/AppShell'

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
      { path: '/send', element: <SendMoneyPage /> },
    ],
  },
])
