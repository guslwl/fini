import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import SidebarNav from '@/components/navigation/SidebarNav'

function AppShell() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        className={`border-r border-border bg-muted/30 transition-[width] duration-200 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className={`border-b border-border py-4 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
          <div
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
          >
            {!isSidebarCollapsed ? <h1 className="text-lg font-semibold">Fini</h1> : null}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="h-8 w-8 rounded-md border border-border text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? '>' : '<'}
            </button>
          </div>
        </div>
        <SidebarNav collapsed={isSidebarCollapsed} />
      </aside>

      <main className="flex-1 p-6">
        <Outlet />
      </main>

      <Toaster />
    </div>
  )
}

export default AppShell
