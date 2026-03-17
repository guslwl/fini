import { Calendar, CalendarDays, HandCoins, House, Repeat, Wallet } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

const navItems = [
  {
    to: '/',
    labelKey: 'nav.home',
    icon: House,
    end: true
  },
  {
    to: '/payables',
    labelKey: 'nav.payables',
    icon: HandCoins,
    children: [
      {
        to: '/payables/calendar',
        labelKey: 'nav.calendar',
        icon: Calendar
      }
    ]
  },
  {
    to: '/scheduled-transactions',
    labelKey: 'nav.scheduled',
    icon: Repeat
  },
  {
    to: '/holidays',
    labelKey: 'nav.holidays',
    icon: CalendarDays
  },
  {
    to: '/accounts',
    labelKey: 'nav.accounts',
    icon: Wallet
  }
]

function SidebarNav({ collapsed = false }) {
  const { t } = useTranslation()

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
                title={collapsed ? t(item.labelKey) : undefined}
                aria-label={collapsed ? t(item.labelKey) : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed ? <span>{t(item.labelKey)}</span> : null}
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
                          title={collapsed ? t(child.labelKey) : undefined}
                          aria-label={collapsed ? t(child.labelKey) : undefined}
                        >
                          <ChildIcon className="h-4 w-4 shrink-0" />
                          {!collapsed ? <span>{t(child.labelKey)}</span> : null}
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
