import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import type { Service } from '@/types'
import { kindIcon, statusMeta } from '@/lib/serviceMeta'
import { useUI } from '@/stores/ui'
import { pct } from '@/lib/utils'
import { StatusDot } from '@/components/ui/StatusDot'

export interface TopoData {
  service: Service
}

export const TopologyNode = memo(function TopologyNode({ data }: { data: TopoData }) {
  const s = data.service
  const Icon = kindIcon[s.kind]
  const meta = statusMeta[s.status]
  const openDrawer = useUI((st) => st.openDrawer)
  const down = s.status === 'offline'
  const alert = down || s.status === 'restarting' || s.status === 'degraded'

  return (
    <div
      onClick={() => openDrawer(s.id)}
      className="group w-[168px] cursor-pointer rounded-2xl border bg-surface px-3 py-2.5 shadow-[var(--shadow-card)] transition-transform hover:scale-[1.03]"
      style={{
        borderColor: alert ? `${meta.hex}66` : 'var(--color-border)',
        boxShadow: down ? `0 0 0 1px ${meta.hex}55, 0 0 24px -6px ${meta.hex}88` : undefined,
        animation: down ? 'pulse-ring 1.6s infinite' : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-transparent" />
      <div className="flex items-center gap-2.5">
        <div
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
          style={{ backgroundColor: `${meta.hex}18`, color: meta.hex }}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-fg">{s.name}</div>
          <div className="flex items-center gap-1 text-[11px]" style={{ color: meta.hex }}>
            <StatusDot status={s.status} size={6} pulse={alert} />
            {meta.label}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10.5px] text-fg-faint">
        <span className="font-mono tabular-nums">CPU {down ? '—' : pct(s.metrics.cpu)}</span>
        <span className="font-mono tabular-nums">{down ? '—' : `${Math.round(s.metrics.ping)}ms`}</span>
      </div>
    </div>
  )
})
