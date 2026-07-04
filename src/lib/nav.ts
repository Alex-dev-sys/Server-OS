import {
  Activity,
  AlarmSmoke,
  Bell,
  Box,
  Boxes,
  Container,
  Database,
  Globe,
  Grab,
  LayoutDashboard,
  Rocket,
  ScrollText,
  Settings,
  ShieldAlert,
  Users,
  Webhook,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  group: 'main' | 'services' | 'ops'
}

export const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { to: '/infrastructure', label: 'Infrastructure', icon: Boxes, group: 'main' },

  { to: '/minecraft', label: 'Minecraft', icon: Box, group: 'services' },
  { to: '/openclaw', label: 'OpenClaw', icon: Grab, group: 'services' },
  { to: '/website', label: 'Website', icon: Globe, group: 'services' },
  { to: '/api', label: 'API', icon: Webhook, group: 'services' },
  { to: '/database', label: 'Database', icon: Database, group: 'services' },
  { to: '/docker', label: 'Docker', icon: Container, group: 'services' },

  { to: '/deployments', label: 'Deployments', icon: Rocket, group: 'ops' },
  { to: '/monitoring', label: 'Monitoring', icon: Activity, group: 'ops' },
  { to: '/logs', label: 'Logs', icon: ScrollText, group: 'ops' },
  { to: '/incidents', label: 'Incidents', icon: ShieldAlert, group: 'ops' },
  { to: '/alerts', label: 'Alerts', icon: Bell, group: 'ops' },
  { to: '/emergency', label: 'Emergency', icon: AlarmSmoke, group: 'ops' },
  { to: '/users', label: 'Users', icon: Users, group: 'ops' },
  { to: '/settings', label: 'Settings', icon: Settings, group: 'ops' },
]

export const GROUP_LABEL: Record<NavItem['group'], string> = {
  main: 'Overview',
  services: 'Services',
  ops: 'Operations',
}
