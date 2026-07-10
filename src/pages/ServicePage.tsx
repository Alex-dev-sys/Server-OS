import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Cpu, HardDrive, MemoryStick, Network, TriangleAlert } from 'lucide-react'
import type { Service, ServiceKind } from '@/types'
import { useInfra } from '@/hooks/useInfra'
import { useClock } from '@/hooks/useClock'
import { serviceHighlights, type ServiceHighlights } from '@/services/serviceDetail'
import { PanelHeader } from '@/components/service/PanelHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Metric } from '@/components/ui/Metric'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StatusDot } from '@/components/ui/StatusDot'
import { LogStream } from '@/components/logs/LogStream'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { kindIcon, severityMeta, statusMeta } from '@/lib/serviceMeta'
import { formatBytes, formatUptime, pct, relativeTime } from '@/lib/utils'

/** service id → deep-view route, where one exists. */
const ROUTE: Record<string, string> = {
  minecraft: '/minecraft',
  openclaw: '/openclaw',
  website: '/website',
  api: '/api',
  postgres: '/database',
  redis: '/database',
  docker: '/docker',
  vpn: '/vpn',
  storage: '/storage',
  queue: '/queue',
  ci: '/ci',
}

const TAGLINE: Partial<Record<ServiceKind, string>> = {
  website: 'Public web frontend',
  api: 'REST API backend',
  postgres: 'Primary PostgreSQL database',
  redis: 'In-memory cache',
  docker: 'Container runtime',
  nginx: 'Edge reverse proxy',
  backup: 'Backup & snapshots',
  monitoring: 'Observability stack',
  vpn: 'WireGuard remote access gateway',
  storage: 'S3-compatible object storage',
  queue: 'Durable asynchronous job broker',
  ci: 'Build, test and deployment executor',
}

export function ServicePage({ primaryId, extraIds = [] }: { primaryId: string; extraIds?: string[] }) {
  const { data, isLoading } = useInfra()
  const now = useClock().getTime()

  const service = data?.services.find((s) => s.id === primaryId)
  const extras = useMemo(
    () => (data ? extraIds.map((id) => data.services.find((s) => s.id === id)).filter(Boolean) as Service[] : []),
    [data, extraIds],
  )
  const highlights = useMemo(() => (service ? serviceHighlights(service) : null), [service])

  if (isLoading || !data || !service || !highlights) return <PageSkeleton />

  const dependents = data.services.filter((s) => s.dependsOn.includes(service.id))
  const upstream = service.dependsOn
    .map((id) => data.services.find((s) => s.id === id))
    .filter(Boolean) as Service[]
  const incidents = data.incidents.filter((i) => i.serviceId === service.id)

  return (
    <div className="space-y-6">
      <PanelHeader service={service} tagline={TAGLINE[service.kind] ?? 'Service'} />

      {/* Resource meters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Meter label="CPU" value={service.metrics.cpu} icon={<Cpu className="h-3.5 w-3.5" />} />
        <Meter
          label="Memory"
          value={service.metrics.ram}
          icon={<MemoryStick className="h-3.5 w-3.5" />}
          sub={formatBytes(service.ramMb)}
        />
        <Meter label="Disk" value={service.metrics.disk} icon={<HardDrive className="h-3.5 w-3.5" />} />
        <Meter
          label="Network"
          value={Math.min(100, service.metrics.network / 5)}
          icon={<Network className="h-3.5 w-3.5" />}
          sub={`${Math.round(service.metrics.network)} Mbps`}
        />
      </div>

      {/* Facts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Metric label="Health" value={pct(service.healthScore)} accent={statusMeta[service.status].hex} />
        <Metric
          label="Crash risk"
          value={pct(service.crashProbability)}
          accent={service.crashProbability > 40 ? '#fbbf24' : undefined}
        />
        <Metric label="Ping" value={`${Math.round(service.metrics.ping)}ms`} />
        <Metric label="Uptime" value={formatUptime(service.uptimeSec)} />
        <Metric label="Restarts" value={service.restartCount} />
        <Metric label="Container" value={<span className="font-mono text-[13px]">{service.container}</span>} />
      </div>

      {/* Highlights */}
      <HighlightsCard highlights={highlights} />

      {/* Extra services (e.g. Redis on the Database page) */}
      {extras.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {extras.map((ex) => (
            <ExtraServiceCard key={ex.id} service={ex} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Dependencies */}
        <Card className="p-5">
          <div className="mb-3 text-[13px] font-semibold text-fg">Dependencies</div>
          <DepList label="Depends on" items={upstream} empty="No upstream services" />
          <div className="my-3 border-t border-border-soft" />
          <DepList label="Required by" items={dependents} empty="Nothing depends on this" />
        </Card>

        {/* Logs */}
        <Card className="lg:col-span-2">
          <CardHeader title="Recent logs" subtitle="live tail" />
          <div className="p-4 pt-3">
            <LogStream lines={service.recentLogs} />
          </div>
        </Card>
      </div>

      {/* Incidents */}
      <Card>
        <CardHeader
          title="Incident history"
          subtitle={incidents.length ? `${incidents.length} incidents` : 'no incidents on record'}
          icon={
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-danger/12 text-danger">
              <TriangleAlert className="h-[18px] w-[18px]" />
            </span>
          }
        />
        <div className="mt-2">
          {incidents.length === 0 ? (
            <div className="px-5 py-8 text-center text-[13px] text-fg-faint">
              No incidents. Trigger a failure from the topology map to see it here.
            </div>
          ) : (
            incidents.map((inc) => {
              const sev = severityMeta[inc.severity]
              return (
                <div key={inc.id} className="flex items-center gap-3 border-b border-border-soft px-5 py-3 last:border-0">
                  <Badge color={sev.hex}>{sev.label}</Badge>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-fg">{inc.title}</div>
                    <div className="truncate text-[12px] text-fg-faint">{inc.rootCause}</div>
                  </div>
                  <div className="shrink-0 text-right text-[11px] text-fg-faint">
                    <div>{relativeTime(inc.startedAt, now)}</div>
                    <div>{inc.resolved ? 'resolved' : 'open'}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}

function HighlightsCard({ highlights }: { highlights: ServiceHighlights }) {
  return (
    <Card>
      <CardHeader title="Highlights" subtitle={highlights.headline} />
      <div className="grid grid-cols-2 gap-3 p-5 pt-3 sm:grid-cols-3 xl:grid-cols-5">
        {highlights.stats.map((st) => (
          <div key={st.label} className="rounded-[var(--radius-md)] border border-border-soft bg-surface-2 px-3.5 py-3">
            <div className="text-[11px] uppercase tracking-wide text-fg-faint">{st.label}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-fg" style={st.accent ? { color: st.accent } : undefined}>
              {st.value}
            </div>
            {st.sub && <div className="text-[11px] text-fg-faint">{st.sub}</div>}
          </div>
        ))}
      </div>
      {highlights.table && (
        <div className="border-t border-border-soft px-5 py-4">
          <div className="mb-2 text-[12px] font-medium text-fg-muted">{highlights.table.title}</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-fg-faint">
                  {highlights.table.cols.map((c, i) => (
                    <th key={c} className={`py-1.5 font-medium ${i === 0 ? '' : 'text-right'}`}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {highlights.table.rows.map((row, ri) => (
                  <tr key={ri} className="border-t border-border-soft">
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`py-2 ${ci === 0 ? 'font-mono text-fg-muted' : 'text-right tabular-nums text-fg-muted'}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  )
}

function ExtraServiceCard({ service }: { service: Service }) {
  const Icon = kindIcon[service.kind]
  const meta = statusMeta[service.status]
  const hi = serviceHighlights(service)
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ backgroundColor: `${meta.hex}18`, color: meta.hex }}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[14px] font-semibold text-fg">{service.name}</span>
            <StatusDot status={service.status} size={7} />
          </div>
          <div className="text-[12px] text-fg-faint">{TAGLINE[service.kind] ?? service.version}</div>
        </div>
        {ROUTE[service.id] && (
          <Link to={ROUTE[service.id]} className="text-fg-faint transition-colors hover:text-fg" title="Open">
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {hi.stats.slice(0, 3).map((st) => (
          <div key={st.label}>
            <div className="text-[10.5px] uppercase tracking-wide text-fg-faint">{st.label}</div>
            <div className="mt-0.5 text-[15px] font-semibold text-fg">{st.value}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Meter({ label, value, icon, sub }: { label: string; value: number; icon: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border-soft bg-surface-2 p-3.5">
      <div className="mb-2 flex items-center justify-between text-[11px] text-fg-faint">
        <span className="flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <span className="font-mono tabular-nums text-fg-muted">{sub ?? pct(value)}</span>
      </div>
      <ProgressBar value={value} height={5} />
    </div>
  )
}

function DepList({ label, items, empty }: { label: string; items: Service[]; empty: string }) {
  return (
    <div>
      <div className="mb-2 text-[11px] uppercase tracking-wide text-fg-faint">{label}</div>
      {items.length === 0 ? (
        <div className="text-[12px] text-fg-faint">{empty}</div>
      ) : (
        <div className="space-y-1.5">
          {items.map((s) => {
            const to = ROUTE[s.id]
            const inner = (
              <>
                <StatusDot status={s.status} size={7} pulse={false} />
                <span className="text-fg-muted">{s.name}</span>
                {to && <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-fg-faint" />}
              </>
            )
            return to ? (
              <Link
                key={s.id}
                to={to}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors hover:bg-surface-2"
              >
                {inner}
              </Link>
            ) : (
              <div key={s.id} className="flex items-center gap-2 px-2 py-1.5 text-[13px]">
                {inner}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
