import { Play, RotateCw, Square } from 'lucide-react'
import type { Service, ServiceAction } from '@/types'
import { useServiceAction } from '@/hooks/useInfra'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function ServiceActions({
  service,
  size = 'sm',
  className,
}: {
  service: Service
  size?: 'sm' | 'md'
  className?: string
}) {
  const action = useServiceAction()
  const busy = service.status === 'restarting'
  const down = service.status === 'offline'

  const run = (a: ServiceAction) => (e: React.MouseEvent) => {
    e.stopPropagation()
    action.mutate({ id: service.id, action: a })
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {down ? (
        <Button size={size} variant="primary" onClick={run('start')} disabled={busy}>
          <Play className="h-4 w-4" /> Start
        </Button>
      ) : (
        <Button size={size} variant="surface" onClick={run('restart')} disabled={busy}>
          <RotateCw className={cn('h-4 w-4', busy && 'animate-spin')} />
          {busy ? 'Restarting' : 'Restart'}
        </Button>
      )}
      <Button
        size={size === 'md' ? 'md' : 'icon'}
        variant="ghost"
        onClick={run('stop')}
        disabled={down || busy}
        aria-label="Stop"
        title="Stop"
      >
        <Square className="h-4 w-4" />
        {size === 'md' && 'Stop'}
      </Button>
    </div>
  )
}
