import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Command, PanelLeftClose, Server } from 'lucide-react'
import { GROUP_LABEL, NAV, type NavItem } from '@/lib/nav'
import { useUI } from '@/stores/ui'
import { useInfra } from '@/hooks/useInfra'
import { cn, formatUptime, pct } from '@/lib/utils'
import { ProgressBar } from '@/components/ui/ProgressBar'

const GROUPS: NavItem['group'][] = ['main', 'services', 'ops']

export function Sidebar() {
  const collapsed = useUI((s) => s.sidebarCollapsed)
  const toggle = useUI((s) => s.toggleSidebar)
  const setCommandOpen = useUI((s) => s.setCommandOpen)
  const { data } = useInfra()
  const host = data?.host

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 248 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      className="relative z-20 flex h-full shrink-0 flex-col border-r border-border bg-surface/60"
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent/25 to-purple/20 ring-1 ring-accent/25">
          <Server className="h-[18px] w-[18px] text-accent" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              className="min-w-0"
            >
              <div className="text-sm font-semibold leading-tight text-fg">Server OS</div>
              <div className="text-[11px] text-fg-faint leading-tight">infra control</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Command trigger */}
      <div className="px-3 pb-2">
        <button
          onClick={() => setCommandOpen(true)}
          className={cn(
            'flex w-full items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-left text-fg-faint transition-colors hover:border-fg-faint hover:text-fg-muted',
            collapsed && 'justify-center px-0',
          )}
        >
          <Command className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="text-[13px]">Search…</span>
              <kbd className="ml-auto rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-fg-faint">
                ⌘K
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-1">
        {GROUPS.map((g) => (
          <div key={g} className="mb-1">
            {!collapsed && (
              <div className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-fg-faint/70">
                {GROUP_LABEL[g]}
              </div>
            )}
            {NAV.filter((n) => n.group === g).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'group relative mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'text-fg'
                      : 'text-fg-muted hover:text-fg hover:bg-surface-2',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-xl bg-surface-2 ring-1 ring-inset ring-accent/15"
                        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                      />
                    )}
                    <item.icon
                      className={cn(
                        'relative h-[18px] w-[18px] shrink-0 transition-colors',
                        isActive && 'text-accent',
                      )}
                    />
                    {!collapsed && <span className="relative truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Host vitals */}
      <div className="border-t border-border px-3 py-3">
        {host && !collapsed ? (
          <div className="space-y-2.5 rounded-xl bg-surface-2 p-3">
            <Vital label="CPU" value={host.cpu} />
            <Vital label="RAM" value={host.ram} />
            <Vital label="Disk" value={host.disk} />
            <div className="flex items-center justify-between pt-0.5 text-[11px]">
              <span className="text-fg-faint">Uptime</span>
              <span className="font-mono text-fg-muted">{formatUptime(host.uptimeSec)}</span>
            </div>
          </div>
        ) : (
          host && (
            <div className="flex flex-col items-center gap-2 py-1">
              <MiniRing value={host.cpu} />
            </div>
          )
        )}
        <button
          onClick={toggle}
          className={cn(
            'mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-fg-faint transition-colors hover:bg-surface-2 hover:text-fg-muted',
            collapsed && 'justify-center',
          )}
        >
          <PanelLeftClose
            className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
          />
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </motion.aside>
  )
}

function Vital({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-fg-faint">{label}</span>
        <span className="font-mono tabular-nums text-fg-muted">{pct(value)}</span>
      </div>
      <ProgressBar value={value} height={5} />
    </div>
  )
}

function MiniRing({ value }: { value: number }) {
  const r = 13
  const c = 2 * Math.PI * r
  const color = value >= 85 ? '#ff4d4f' : value >= 70 ? '#fbbf24' : '#6ee7b7'
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" className="-rotate-90">
      <circle cx="17" cy="17" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
      <circle
        cx="17"
        cy="17"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (value / 100) * c}
      />
    </svg>
  )
}
