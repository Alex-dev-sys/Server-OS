import { useInfra, useResetDemo, useSimulateCrash } from '@/hooks/useInfra'
import { useToasts } from '@/stores/toasts'
import { useUI } from '@/stores/ui'
import { Section } from '@/components/ui/Section'
import { HeroPanel } from '@/components/dashboard/HeroPanel'
import { ServiceCard } from '@/components/infrastructure/ServiceCard'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { ActivityPanel, AttentionPanel } from '@/components/dashboard/AttentionPanel'

export function DashboardPage() {
  const { data, isLoading } = useInfra()
  const simulateCrash = useSimulateCrash()
  const resetDemo = useResetDemo()
  const pushToast = useToasts((state) => state.push)
  const openDemoTour = useUI((state) => state.openDemoTour)
  const closeDemoTour = useUI((state) => state.closeDemoTour)

  if (isLoading || !data) return <PageSkeleton />

  const { services, summary } = data
  return (
    <div className="space-y-7">
      <HeroPanel
        summary={summary}
        onDemoIncident={() => simulateCrash.mutate('postgres', {
          onSuccess: () => pushToast({ title: 'Demo incident started', message: 'PostgreSQL is offline. Follow the cascade across the map.', tone: 'info' }),
          onError: () => pushToast({ title: 'Could not start demo incident', tone: 'error' }),
        })}
        demoPending={simulateCrash.isPending}
        onResetDemo={() => resetDemo.mutate(undefined, {
          onSuccess: () => {
            closeDemoTour()
            pushToast({ title: 'Demo reset', message: 'All services and incidents returned to their baseline state.', tone: 'success' })
          },
          onError: () => pushToast({ title: 'Could not reset demo', tone: 'error' }),
        })}
        resetPending={resetDemo.isPending}
        onGuidedDemo={() => simulateCrash.mutate('postgres', {
          onSuccess: () => {
            openDemoTour()
            pushToast({ title: 'Guided demo started', message: 'Follow the panel in the lower-right corner.', tone: 'info' })
          },
          onError: () => pushToast({ title: 'Could not start guided demo', tone: 'error' }),
        })}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <AttentionPanel services={services} />
        <ActivityPanel items={data.notifications} now={data.serverTimeMs} />
      </div>

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
