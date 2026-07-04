import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { InfrastructurePage } from '@/pages/InfrastructurePage'
import { IncidentsPage } from '@/pages/IncidentsPage'
import { EmergencyPage } from '@/pages/EmergencyPage'
import { LogsPage } from '@/pages/LogsPage'
import { MonitoringPage } from '@/pages/MonitoringPage'
import { AlertsPage } from '@/pages/AlertsPage'
import { MinecraftPage } from '@/pages/MinecraftPage'
import { OpenClawPage } from '@/pages/OpenClawPage'
import { ServicePage } from '@/pages/ServicePage'
import { DeploymentsPage } from '@/pages/DeploymentsPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'

const soon = (title: string, phase: string, note: string) => (
  <PlaceholderPage title={title} phase={phase} note={note} />
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'infrastructure', element: <InfrastructurePage /> },

      { path: 'minecraft', element: <MinecraftPage /> },
      { path: 'openclaw', element: <OpenClawPage /> },
      { path: 'website', element: <ServicePage primaryId="website" /> },
      { path: 'api', element: <ServicePage primaryId="api" /> },
      { path: 'database', element: <ServicePage primaryId="postgres" extraIds={['redis']} /> },
      { path: 'docker', element: <ServicePage primaryId="docker" /> },

      { path: 'deployments', element: <DeploymentsPage /> },
      { path: 'monitoring', element: <MonitoringPage /> },
      { path: 'logs', element: <LogsPage /> },
      { path: 'incidents', element: <IncidentsPage /> },
      { path: 'alerts', element: <AlertsPage /> },
      { path: 'emergency', element: <EmergencyPage /> },
      { path: 'users', element: soon('Users', 'Phase 4', 'Access control and audit of who did what.') },
      { path: 'settings', element: soon('Settings', 'Phase 4', 'Theme, integrations and automation rules.') },
    ],
  },
])
