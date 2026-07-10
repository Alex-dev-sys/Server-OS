import { AnimatePresence, motion } from 'framer-motion'
import {
  Cpu,
  FileText,
  FolderOpen,
  HardDrive,
  KeyRound,
  MemoryStick,
  TerminalSquare,
  X,
  Zap,
} from 'lucide-react'
import type { Service } from '@/types'
import { useInfra, useSimulateCrash } from '@/hooks/useInfra'
import { useUI } from '@/stores/ui'
import { kindIcon, statusMeta } from '@/lib/serviceMeta'
import { formatBytes, formatUptime, pct, relativeTime } from '@/lib/utils'
import { StatusDot } from '@/components/ui/StatusDot'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Metric } from '@/components/ui/Metric'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ServiceActions } from './ServiceActions'
import { LogStream } from '@/components/logs/LogStream'
import { ServiceSettings } from '@/components/service/ServiceSettings'

export function ServiceDrawer() {
  const id = useUI((s) => s.drawerServiceId)
  const close = useUI((s) => s.closeDrawer)
  const { data } = useInfra()
  const service = data?.services.find((s) => s.id === id) ?? null

  return (
    <AnimatePresence>
      {service && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[460px] flex-col border-l border-border bg-surface shadow-[var(--shadow-pop)]"
          >
            <DrawerBody service={service} onClose={close} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function DrawerBody({ service, onClose }: { service: Service; onClose: () => void }) {
  const Icon = kindIcon[service.kind]
  const meta = statusMeta[service.status]
  const crash = useSimulateCrash()
  const now = Date.now()

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-border p-5">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: `${meta.hex}18`, color: meta.hex }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-fg">{service.name}</h2>
            <StatusDot status={service.status} />
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[12px] text-fg-faint">
            <span>{service.version}</span>
            <span>·</span>
            <span className="font-mono">{service.ip}</span>
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close">
          <X className="h-[18px] w-[18px]" />
        </Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {/* Primary actions */}
        <div className="flex items-center justify-between gap-2">
          <Badge color={meta.hex}>
            <StatusDot status={service.status} size={6} pulse={false} /> {meta.label}
          </Badge>
          <ServiceActions service={service} size="sm" />
        </div>

        {/* Live resource meters */}
        <div className="grid grid-cols-2 gap-2.5">
          <Meter label="CPU" value={service.metrics.cpu} icon={<Cpu className="h-3.5 w-3.5" />} />
          <Meter label="RAM" value={service.metrics.ram} icon={<MemoryStick className="h-3.5 w-3.5" />} sub={formatBytes(service.ramMb)} />
          <Meter label="Disk" value={service.metrics.disk} icon={<HardDrive className="h-3.5 w-3.5" />} />
          <Meter label="Net" value={Math.min(100, service.metrics.network / 5)} icon={<Zap className="h-3.5 w-3.5" />} sub={`${Math.round(service.metrics.network)} Mbps`} raw />
        </div>

        {/* Facts grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <Metric label="Health" value={pct(service.healthScore)} accent={meta.hex} />
          <Metric label="Crash risk" value={pct(service.crashProbability)} accent={service.crashProbability > 40 ? '#fbbf24' : undefined} />
          <Metric label="Ping" value={`${Math.round(service.metrics.ping)}ms`} />
          <Metric label="Uptime" value={formatUptime(service.uptimeSec)} />
          <Metric label="Restarts" value={service.restartCount} />
          <Metric label="Container" value={<span className="font-mono text-[13px]">{service.container}</span>} />
        </div>

        {/* Detail rows */}
        <div className="rounded-[var(--radius-md)] border border-border-soft bg-surface-2 text-[13px]">
          <Row k="Hostname" v={service.hostname} mono />
          <Row k="IP address" v={service.ip} mono />
          <Row k="Version" v={service.version} />
          <Row k="Last deploy" v={relativeTime(service.lastDeploy, now)} />
          <Row k="Last backup" v={relativeTime(service.lastBackup, now)} last />
        </div>

        {/* Secondary tools */}
        <div className="grid grid-cols-5 gap-2">
          <Tool icon={<TerminalSquare className="h-4 w-4" />} label="Console" />
          <Tool icon={<FileText className="h-4 w-4" />} label="Logs" />
          <Tool icon={<FolderOpen className="h-4 w-4" />} label="Files" />
          <ServiceSettings service={service} mode="tool" />
          <Tool icon={<KeyRound className="h-4 w-4" />} label="SSH" />
        </div>

        {/* Recent logs */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-fg">Recent logs</span>
            {service.status !== 'offline' && (
              <button
                onClick={() => crash.mutate(service.id)}
                className="text-[11px] text-fg-faint transition-colors hover:text-danger"
              >
                simulate failure ↯
              </button>
            )}
          </div>
          <LogStream lines={service.recentLogs} compact />
        </div>
      </div>
    </>
  )
}

function Meter({
  label,
  value,
  icon,
  sub,
  raw,
}: {
  label: string
  value: number
  icon: React.ReactNode
  sub?: string
  raw?: boolean
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border-soft bg-surface-2 p-3">
      <div className="mb-2 flex items-center justify-between text-[11px] text-fg-faint">
        <span className="flex items-center gap-1.5">{icon}{label}</span>
        <span className="font-mono tabular-nums text-fg-muted">{sub ?? pct(value)}</span>
      </div>
      <ProgressBar value={raw ? value : value} height={5} />
    </div>
  )
}

function Row({ k, v, mono, last }: { k: string; v: string; mono?: boolean; last?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between px-3.5 py-2.5 ${last ? '' : 'border-b border-border-soft'}`}
    >
      <span className="text-fg-faint">{k}</span>
      <span className={mono ? 'font-mono text-fg-muted' : 'text-fg-muted'}>{v}</span>
    </div>
  )
}

function Tool({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      className="flex flex-col items-center gap-1.5 rounded-xl border border-border-soft bg-surface-2 py-2.5 text-fg-muted transition-colors hover:border-fg-faint hover:text-fg"
      title={`${label} (coming soon)`}
    >
      {icon}
      <span className="text-[10px]">{label}</span>
    </button>
  )
}
