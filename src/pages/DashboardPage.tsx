import { Waypoints } from 'lucide-react'
import { useInfra } from '@/hooks/useInfra'
import { Card, CardHeader } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'
import { Badge } from '@/components/ui/Badge'
import { HeroPanel } from '@/components/dashboard/HeroPanel'
import { TopologyMap } from '@/components/infrastructure/TopologyMap'
import { ServiceCard } from '@/components/infrastructure/ServiceCard'
import { PageSkeleton } from '@/components/ui/PageSkeleton'

export function DashboardPage() {
  const { data, isLoading } = useInfra()

  if (isLoading || !data) return <PageSkeleton />

  const { services, summary } = data
  const attention = services.filter((s) => s.status !== 'healthy')

  return (
    <div className="space-y-7">
      <HeroPanel summary={summary} />

      <Card>
        <CardHeader
          title="Infrastructure Map"
          subtitle="Live dependency topology · click a node for detail"
          icon={
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/12 text-accent">
              <Waypoints className="h-[18px] w-[18px]" />
            </span>
          }
          action={
            attention.length ? (
              <Badge color="#ff4d4f">{attention.length} need attention</Badge>
            ) : (
              <Badge color="#6ee7b7">all healthy</Badge>
            )
          }
        />
        <div className="mt-2 border-t border-border-soft">
          <TopologyMap services={services} />
        </div>
      </Card>

      <Section title="Services" subtitle={`${summary.online} online · ${summary.degraded} degraded · ${summary.offline} down`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {services.map((s, i) => (
            <ServiceCard key={s.id} service={s} index={i} />
          ))}
        </div>
      </Section>
    </div>
  )
}
