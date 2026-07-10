import cors from 'cors'
import express, { type Response } from 'express'
import type { Pool } from 'pg'
import { z } from 'zod'
import { signAccessToken, verifyPassword } from './auth.js'
import type { Config } from './config.js'
import { inTransaction } from './db/pool.js'
import { events, publishSnapshotChanged } from './events.js'
import { errorHandler, requireAuth, requireRole, type AuthenticatedRequest } from './http.js'

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })
const commandSchema = z.object({ action: z.enum(['start', 'restart', 'stop', 'rollback']) })

interface ServiceRow {
  id: string
  name: string
  kind: string
  status: string
  hostname: string
  version: string
  updatedAt: string
}

async function snapshot(pool: Pool) {
  const [services, incidents] = await Promise.all([
    pool.query<ServiceRow>(
      `SELECT id, name, kind, status, hostname, version, updated_at AS "updatedAt"
       FROM services ORDER BY name`,
    ),
    pool.query(
      `SELECT i.id, i.service_id AS "serviceId", i.severity, i.title, i.root_cause AS "rootCause",
              i.started_at AS "startedAt", i.resolved_at AS "resolvedAt", i.resolved_by AS "resolvedBy"
       FROM incidents i ORDER BY i.started_at DESC LIMIT 100`,
    ),
  ])
  return { services: services.rows, incidents: incidents.rows, serverTimeMs: Date.now() }
}

function writeEvent(res: Response, event: string, body: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(body)}\n\n`)
}

export function createApp(config: Config, pool: Pool) {
  const app = express()
  app.disable('x-powered-by')
  app.use(cors({ origin: config.CORS_ORIGIN, methods: ['GET', 'POST'], allowedHeaders: ['Authorization', 'Content-Type'] }))
  app.use(express.json({ limit: '16kb' }))

  app.get('/healthz', async (_req, res) => {
    await pool.query('SELECT 1')
    res.json({ ok: true })
  })

  app.post('/api/v1/auth/login', async (req, res) => {
    const { email, password } = loginSchema.parse(req.body)
    const result = await pool.query<{ id: string; email: string; passwordHash: string; role: 'owner' | 'admin' | 'operator' | 'viewer' }>(
      `SELECT id, email, password_hash AS "passwordHash", role
       FROM users WHERE email = $1`,
      [email.toLowerCase()],
    )
    const user = result.rows[0]
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      res.status(401).json({ error: 'invalid_credentials' })
      return
    }
    res.json({ accessToken: signAccessToken(user, config), user: { id: user.id, email: user.email, role: user.role } })
  })

  app.get('/api/v1/me', requireAuth(config), (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user })
  })

  app.get('/api/v1/services', requireAuth(config), async (_req, res) => {
    const data = await snapshot(pool)
    res.json(data)
  })

  app.get('/api/v1/events', requireAuth(config), async (_req, res) => {
    res.status(200)
    res.set({
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'X-Accel-Buffering': 'no',
    })
    res.flushHeaders()

    const sendSnapshot = async () => writeEvent(res, 'snapshot', await snapshot(pool))
    const onChange = () => void sendSnapshot().catch(() => res.end())
    const heartbeat = setInterval(() => writeEvent(res, 'heartbeat', { at: Date.now() }), 25_000)
    events.on('snapshot-changed', onChange)
    await sendSnapshot()

    res.on('close', () => {
      clearInterval(heartbeat)
      events.off('snapshot-changed', onChange)
    })
  })

  app.post(
    '/api/v1/services/:serviceId/commands',
    requireAuth(config),
    requireRole('owner', 'admin', 'operator'),
    async (req: AuthenticatedRequest, res) => {
      const { action } = commandSchema.parse(req.body)
      const command = await inTransaction(pool, async (client) => {
        const service = await client.query<{ id: string }>('SELECT id FROM services WHERE id = $1 FOR UPDATE', [req.params.serviceId])
        if (!service.rowCount) return null

        const created = await client.query(
          `INSERT INTO commands (service_id, action, requested_by)
           VALUES ($1, $2, $3)
           RETURNING id, service_id AS "serviceId", action, status, created_at AS "createdAt"`,
          [req.params.serviceId, action, req.user?.id],
        )
        await client.query(
          `INSERT INTO audit_logs (actor_id, action, target, result, metadata)
           VALUES ($1, $2, $3, 'ok', $4::jsonb)`,
          [req.user?.id, `service.${action}.requested`, req.params.serviceId, JSON.stringify({ commandId: created.rows[0].id })],
        )
        return created.rows[0]
      })

      if (!command) {
        res.status(404).json({ error: 'service_not_found' })
        return
      }
      publishSnapshotChanged()
      res.status(202).json({ command })
    },
  )

  app.post(
    '/api/v1/incidents/:incidentId/resolve',
    requireAuth(config),
    requireRole('owner', 'admin', 'operator'),
    async (req: AuthenticatedRequest, res) => {
      const outcome = await inTransaction(pool, async (client) => {
        const incident = await client.query<{ id: string; serviceStatus: string; resolvedAt: string | null }>(
          `SELECT i.id, i.resolved_at AS "resolvedAt", s.status AS "serviceStatus"
           FROM incidents i JOIN services s ON s.id = i.service_id
           WHERE i.id = $1 FOR UPDATE`,
          [req.params.incidentId],
        )
        const current = incident.rows[0]
        if (!current) return 'missing' as const
        if (current.resolvedAt) return 'already_resolved' as const
        if (current.serviceStatus !== 'healthy') return 'service_unhealthy' as const

        await client.query('UPDATE incidents SET resolved_at = now(), resolved_by = $2 WHERE id = $1', [current.id, req.user?.id])
        await client.query(
          `INSERT INTO audit_logs (actor_id, action, target, result)
           VALUES ($1, 'incident.resolve', $2, 'ok')`,
          [req.user?.id, current.id],
        )
        return 'resolved' as const
      })

      if (outcome === 'missing') {
        res.status(404).json({ error: 'incident_not_found' })
        return
      }
      if (outcome === 'already_resolved') {
        res.status(409).json({ error: 'incident_already_resolved' })
        return
      }
      if (outcome === 'service_unhealthy') {
        res.status(409).json({ error: 'service_not_healthy' })
        return
      }
      publishSnapshotChanged()
      res.status(204).end()
    },
  )

  app.use(errorHandler)
  return app
}
