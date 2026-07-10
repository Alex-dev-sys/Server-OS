import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from '@/components/command/CommandPalette'
import { ServiceDrawer } from '@/components/infrastructure/ServiceDrawer'
import { useUI } from '@/stores/ui'
import { applyAccent, useSettings } from '@/stores/settings'
import { ToastViewport } from '@/components/notifications/ToastViewport'
import { DemoTour } from '@/components/dashboard/DemoTour'

export function AppShell() {
  const setCommandOpen = useUI((s) => s.setCommandOpen)
  const accent = useSettings((s) => s.accent)
  const density = useSettings((s) => s.density)

  // Keep the live theme accent in sync with the persisted setting.
  useEffect(() => applyAccent(accent), [accent])

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
          <div
            className={`mx-auto w-full max-w-[1600px] ${density === 'compact' ? 'px-3 py-4 sm:px-4' : 'px-3 py-4 sm:px-6 sm:py-6'}`}
          >
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
      <ServiceDrawer />
      <ToastViewport />
      <DemoTour />
    </div>
  )
}
