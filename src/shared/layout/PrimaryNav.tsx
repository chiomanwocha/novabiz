import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import { BrandMark } from './BrandMark'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
}

function HomeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M4 11.5 12 4l8 7.5M6 9.5V20h12V9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M21 3 3 10.5l7.5 3L14 21l7-18Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <HomeIcon /> },
  { to: '/send', label: 'Send Money', icon: <SendIcon /> },
]

/**
 * One nav, repositioned with CSS rather than duplicated: a navy bottom tab bar below md, a
 * navy left sidebar rail — full viewport height, brand mark at its top — from md up. It's
 * solid FirstBank navy at every size, not just on desktop, so AppShell's header never needs
 * to paint over it: on mobile the header still carries the (light) brand mark since there's
 * no sidebar to hold it there. The active link is never colour alone: it also gets a gold
 * border (top on the tab bar, left on the rail), a semibold label, and aria-current="page".
 */
export function PrimaryNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 flex bg-brand-navy pb-[env(safe-area-inset-bottom)] md:static md:inset-auto md:z-auto md:flex md:w-60 md:shrink-0 md:flex-col md:gap-1 md:px-3 md:pb-6 md:pt-5"
    >
      <div className="hidden px-3 pb-6 pt-1 md:block">
        <BrandMark inverted />
      </div>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 border-t-4 py-2 text-xs font-medium transition md:flex-none md:flex-row md:justify-start md:gap-3 md:rounded-lg md:border-l-4 md:border-t-0 md:px-3 md:py-2.5 md:text-sm ${
              isActive
                ? 'border-accent font-semibold text-white md:bg-white/10'
                : 'border-transparent text-white/65 hover:text-white md:hover:bg-white/5'
            }`
          }
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
