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
    icon: HandCoins,
    children: [
      {
        to: '/payables/recurring',
        label: 'Recurring',
        icon: Repeat
      },
      {
        to: '/payables/calendar',
        label: 'Calendar',
        icon: Calendar
      }
    ]
  },
  {
    to: '/holidays',
    label: 'Holidays',
    icon: CalendarDays
  }
]

function SidebarNav({ collapsed = false }) {
  const linkClassName = ({ isActive }) =>
    cn(
      'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
      collapsed && 'justify-center px-2',
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    )

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
                className={linkClassName}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed ? <span>{item.label}</span> : null}
              </NavLink>

              {item.children?.length ? (
                <ul className={cn('m-0 mt-1 list-none space-y-1 p-0', !collapsed && 'pl-4')}>
                  {item.children.map((child) => {
                    const ChildIcon = child.icon

                    return (
                      <li key={child.to}>
                        <NavLink
                          to={child.to}
                          className={linkClassName}
                          title={collapsed ? child.label : undefined}
                          aria-label={collapsed ? child.label : undefined}
                        >
                          <ChildIcon className="h-4 w-4 shrink-0" />
                          {!collapsed ? <span>{child.label}</span> : null}
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default SidebarNav
