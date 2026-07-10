import type { InfraSnapshot, ServiceAction } from '@/types'
import { engine } from './mock/engine'

// ── Async control surface ────────────────────────────────
// Today: backed by the in-memory mock engine with simulated latency.
// TODO(backend): swap these bodies for fetch()/WebSocket calls. Component
// code and hooks never change — they only touch this module.

const NET = () => 120 + Math.round(Math.abs(Math.sin(Date.now())) * 260)

function withLatency<T>(value: () => T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value()), NET()))
}

export const api = {
  getSnapshot(): Promise<InfraSnapshot> {
    return withLatency(() => engine.getSnapshot())
  },

  /** Live stream. Returns an unsubscribe fn. Maps to a WebSocket later. */
  subscribe(cb: (snap: InfraSnapshot) => void): () => void {
    return engine.subscribe(cb)
  },

  dispatchAction(serviceId: string, action: ServiceAction): Promise<void> {
    return engine.dispatch(serviceId, action)
  },

  simulateCrash(serviceId: string): Promise<void> {
    return withLatency(() => engine.crash(serviceId))
  },

  resolveIncident(id: string): Promise<void> {
    return withLatency(() => engine.resolveIncident(id))
  },

  rollbackDeployment(id: string): Promise<void> {
    return withLatency(() => engine.rollback(id))
  },

  panic(): Promise<{ recovered: number }> {
    return engine.panic()
  },

  markNotificationsRead(): Promise<void> {
    return withLatency(() => engine.markNotificationsRead())
  },

  resetDemo(): Promise<void> {
    return withLatency(() => engine.resetDemo())
  },
}
