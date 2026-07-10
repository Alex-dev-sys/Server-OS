import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Search, Wifi } from 'lucide-react'
import { useUI } from '@/stores/ui'
import { useInfra, useMarkNotificationsRead } from '@/hooks/useInfra'
import { useClock } from '@/hooks/useClock'
import { NotificationList } from '@/components/notifications/NotificationList'

export function Topbar() {
  const now = useClock()
  const setCommandOpen = useUI((s) => s.setCommandOpen)
  const { data } = useInfra()
  const [notifOpen, setNotifOpen] = useState(false)
  const markRead = useMarkNotificationsRead()

  const unread = data?.notifications.filter((n) => !n.read).length ?? 0
  const online = data ? data.summary.offline === 0 : true

  const local = now.toLocaleTimeString('en-GB', { hour12: false })
  const server = new Date(now.getTime() + 3 * 3600_000).toLocaleTimeString('en-GB', {
    hour12: false,
    timeZone: 'UTC',
  })

  return (
    <header className="relative z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface/50 px-5 backdrop-blur-xl">
      {/* Search */}
      <button
        onClick={() => setCommandOpen(true)}
        title="Search services, logs and commands"
        className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2.5 rounded-xl border border-border bg-surface-2/70 px-0 text-left text-fg-faint transition-colors hover:border-fg-faint sm:w-72 sm:justify-start sm:px-3"
      >
        <Search className="h-4 w-4" />
        <span className="hidden text-[13px] sm:inline">Search services, logs, commands…</span>
        <kbd className="ml-auto hidden rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        {/* Connection */}
        <div className="hidden items-center gap-2 rounded-lg border border-border bg-surface-2/70 px-2.5 py-1.5 md:flex">
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
              style={{ backgroundColor: online ? '#6ee7b7' : '#ff4d4f' }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: online ? '#6ee7b7' : '#ff4d4f' }}
            />
          </span>
          <Wifi className="h-3.5 w-3.5 text-fg-faint" />
          <span className="text-[12px] text-fg-muted">{online ? 'Connected' : 'Degraded'}</span>
        </div>

        {/* Clocks */}
        <div className="hidden flex-col items-end lg:flex">
          <div className="font-mono text-[13px] tabular-nums text-fg">{local}</div>
          <div className="font-mono text-[10px] tabular-nums text-fg-faint">SRV {server} UTC</div>
        </div>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              const next = !notifOpen
              setNotifOpen(next)
              if (next && unread) markRead.mutate()
            }}
            className="relative grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface-2/70 text-fg-muted transition-colors hover:text-fg"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                {unread}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                  className="absolute right-0 top-11 z-40 w-80 origin-top-right"
                >
                  <NotificationList
                    items={data?.notifications ?? []}
                    now={now.getTime()}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User */}
        <button className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/70 py-1 pl-1 pr-3 transition-colors hover:border-fg-faint">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-purple/40 to-accent/30 text-[12px] font-bold text-fg">
            D
          </span>
          <span className="hidden text-[13px] font-medium text-fg-muted sm:block">danil</span>
        </button>
      </div>
    </header>
  )
}
