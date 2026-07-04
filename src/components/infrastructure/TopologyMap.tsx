import { useMemo } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  type Edge,
  type Node,
  type NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { Service } from '@/types'
import { statusMeta } from '@/lib/serviceMeta'
import { TopologyNode, type TopoData } from './TopologyNode'

const POS: Record<string, { x: number; y: number }> = {
  nginx: { x: 20, y: 40 },
  website: { x: 250, y: 0 },
  api: { x: 250, y: 130 },
  postgres: { x: 490, y: 70 },
  redis: { x: 490, y: 190 },
  docker: { x: 20, y: 300 },
  minecraft: { x: 250, y: 285 },
  openclaw: { x: 250, y: 400 },
  backup: { x: 490, y: 320 },
  monitoring: { x: 20, y: 430 },
}

const nodeTypes: NodeTypes = { service: TopologyNode }

export function TopologyMap({ services }: { services: Service[] }) {
  const byId = useMemo(() => new Map(services.map((s) => [s.id, s])), [services])

  const nodes: Node<TopoData>[] = useMemo(
    () =>
      services.map((s) => ({
        id: s.id,
        type: 'service',
        position: POS[s.id] ?? { x: 0, y: 0 },
        data: { service: s },
        draggable: false,
        connectable: false,
        selectable: false,
      })),
    [services],
  )

  const edges: Edge[] = useMemo(() => {
    const list: Edge[] = []
    for (const s of services) {
      for (const dep of s.dependsOn) {
        const upstream = byId.get(dep)
        if (!upstream) continue
        const broken =
          upstream.status === 'offline' || upstream.status === 'restarting'
        const color = broken ? '#ff4d4f' : statusMeta[upstream.status].hex
        list.push({
          id: `${dep}->${s.id}`,
          source: dep,
          target: s.id,
          animated: !broken && upstream.status !== 'offline',
          style: {
            stroke: color,
            strokeWidth: broken ? 2 : 1.4,
            strokeDasharray: broken ? '5 4' : undefined,
            opacity: broken ? 0.9 : 0.45,
          },
        })
      }
    }
    return list
  }, [services, byId])

  return (
    <div className="h-[520px] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll={false}
        minZoom={0.5}
        maxZoom={1.4}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#1c2029" />
      </ReactFlow>
    </div>
  )
}
