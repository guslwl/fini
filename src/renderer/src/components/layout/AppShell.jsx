import { Outlet } from 'react-router-dom'
import SidebarNav from '@/components/navigation/SidebarNav'

function AppShell() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-muted/30">
        <div className="border-b border-border px-4 py-4">
          <h1 className="text-lg font-semibold">Fini</h1>
        </div>
        <SidebarNav />
      </aside>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell
