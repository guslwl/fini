import { Calendar, CalendarDays, HandCoins, House, Repeat } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

const navItems = [
  {
    to: '/',
    label: 'Home',
    icon: House,
    end: true
  },
  {
    to: '/payables',
    label: 'Payables',
    icon: HandCoins
  },
  {
    to: '/recurring',
    label: 'Recurring',
    icon: Repeat
  },
  {
    to: '/calendar',
    label: 'Calendar',
    icon: Calendar
  },
  {
    to: '/holidays',
    label: 'Holidays',
    icon: CalendarDays
  }
]

function SidebarNav() {
  return (
    <nav className="p-3">
      <ul className="m-0 list-none space-y-1 p-0">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default SidebarNav
