import { createElement, lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell'
import { PageSkeleton } from '@/components/ui/PageSkeleton'
import { RouteErrorPage } from '@/pages/RouteErrorPage'

const dashboard = lazy(async () => ({ default: (await import('@/pages/DashboardPage')).DashboardPage }))
const infrastructure = lazy(async () => ({ default: (await import('@/pages/InfrastructurePage')).InfrastructurePage }))
const incidents = lazy(async () => ({ default: (await import('@/pages/IncidentsPage')).IncidentsPage }))
const emergency = lazy(async () => ({ default: (await import('@/pages/EmergencyPage')).EmergencyPage }))
const logs = lazy(async () => ({ default: (await import('@/pages/LogsPage')).LogsPage }))
const monitoring = lazy(async () => ({ default: (await import('@/pages/MonitoringPage')).MonitoringPage }))
const alerts = lazy(async () => ({ default: (await import('@/pages/AlertsPage')).AlertsPage }))
const minecraft = lazy(async () => ({ default: (await import('@/pages/MinecraftPage')).MinecraftPage }))
const openclaw = lazy(async () => ({ default: (await import('@/pages/OpenClawPage')).OpenClawPage }))
const service = lazy(async () => ({ default: (await import('@/pages/ServicePage')).ServicePage }))
const deployments = lazy(async () => ({ default: (await import('@/pages/DeploymentsPage')).DeploymentsPage }))
const users = lazy(async () => ({ default: (await import('@/pages/UsersPage')).UsersPage }))
const settings = lazy(async () => ({ default: (await import('@/pages/SettingsPage')).SettingsPage }))

function page(element: ReactNode) {
  return <Suspense fallback={<PageSkeleton />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: page(createElement(dashboard)) },
      { path: 'infrastructure', element: page(createElement(infrastructure)) },
      { path: 'minecraft', element: page(createElement(minecraft)) },
      { path: 'openclaw', element: page(createElement(openclaw)) },
      { path: 'website', element: page(createElement(service, { primaryId: 'website' })) },
      { path: 'api', element: page(createElement(service, { primaryId: 'api' })) },
      { path: 'database', element: page(createElement(service, { primaryId: 'postgres', extraIds: ['redis'] })) },
      { path: 'docker', element: page(createElement(service, { primaryId: 'docker' })) },
      { path: 'vpn', element: page(createElement(service, { primaryId: 'vpn' })) },
      { path: 'storage', element: page(createElement(service, { primaryId: 'storage' })) },
      { path: 'queue', element: page(createElement(service, { primaryId: 'queue' })) },
      { path: 'ci', element: page(createElement(service, { primaryId: 'ci' })) },
      { path: 'deployments', element: page(createElement(deployments)) },
      { path: 'monitoring', element: page(createElement(monitoring)) },
      { path: 'logs', element: page(createElement(logs)) },
      { path: 'incidents', element: page(createElement(incidents)) },
      { path: 'alerts', element: page(createElement(alerts)) },
      { path: 'emergency', element: page(createElement(emergency)) },
      { path: 'users', element: page(createElement(users)) },
      { path: 'settings', element: page(createElement(settings)) },
    ],
  },
])
