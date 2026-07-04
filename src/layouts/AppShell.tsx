import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from '@/components/command/CommandPalette'
import { ServiceDrawer } from '@/components/infrastructure/ServiceDrawer'
import { useUI } from '@/stores/ui'

export function AppShell() {
  const setCommandOpen = useUI((s) => s.setCommandOpen)

  // Global ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setCommandOpen])

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="relative flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
      <ServiceDrawer />
    </div>
  )
}
