import type { InfraSnapshot } from '@/types'
import { clamp, seeded } from '@/lib/utils'
import { api } from './api'

// ── Time-series history for the monitoring charts ───────────
// The mock engine only holds *current* metrics, so this module accumulates a
// rolling buffer of real samples off the live subscription and synthesises the
// older portion of any requested range deterministically. The last point of
// every series is always the freshest real sample, so charts read as live.
//
// TODO(backend): drop the synthetic backfill and point `seriesForRange` at a
// real metrics store (Prometheus range query / TimescaleDB) that already owns
// history. The Sample shape and the hook API stay identical.

export interface Sample {
  t: number // epoch ms
  cpu: number // %
  ram: number // %
  disk: number // %
  net: number // Mbps (fleet avg)
  ping: number // ms (fleet avg)
}

export type MetricKey = keyof Omit<Sample, 't'>

const CAP = 1200 // ~40min of real samples at the 2s engine cadence
const buf: Sample[] = []
const listeners = new Set<() => void>()
let stopIngest: (() => void) | null = null
let consumers = 0

function avg(snap: InfraSnapshot, sel: (m: number) => number, pick: (m: InfraSnapshot['services'][number]['metrics']) => number): number {
  const live = snap.services.filter((s) => s.status !== 'offline')
  if (!live.length) return 0
  return sel(live.reduce((a, s) => a + pick(s.metrics), 0) / live.length)
}

function ingest(snap: InfraSnapshot) {
  const sample: Sample = {
    t: snap.serverTimeMs,
    cpu: snap.host.cpu,
    ram: snap.host.ram,
    disk: snap.host.disk,
    net: avg(snap, (x) => x, (m) => m.network),
    ping: avg(snap, (x) => x, (m) => m.ping),
  }
  buf.push(sample)
  if (buf.length > CAP) buf.shift()
  listeners.forEach((l) => l())
}

/** Reference-counted: only collect while at least one monitoring view is mounted. */
export function startMetricHistory() {
  consumers++
  if (!stopIngest) stopIngest = api.subscribe(ingest)

  return () => {
    consumers--
    if (consumers === 0) {
      stopIngest?.()
      stopIngest = null
    }
  }
}

export function subscribeHistory(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function getSampleCount() {
  return buf.length
}

export const RANGES = [
  { key: '15m', label: '15m', ms: 15 * 60_000 },
  { key: '1h', label: '1h', ms: 60 * 60_000 },
  { key: '6h', label: '6h', ms: 6 * 3600_000 },
  { key: '24h', label: '24h', ms: 24 * 3600_000 },
  { key: '7d', label: '7d', ms: 7 * 86400_000 },
  { key: '30d', label: '30d', ms: 30 * 86400_000 },
] as const

export type RangeKey = (typeof RANGES)[number]['key']

const BASELINE: Record<MetricKey, number> = { cpu: 34, ram: 52, disk: 61, net: 120, ping: 24 }
const CEIL: Record<MetricKey, number> = { cpu: 100, ram: 100, disk: 100, net: 940, ping: 260 }

/** Deterministic synthetic value for a metric at bucket `i`, drifting toward
 *  the latest real reading so synthetic history joins the live tail smoothly. */
function synth(metric: MetricKey, i: number, n: number, latest: number, rangeMs: number): number {
  const base = BASELINE[metric]
  const wave = Math.sin((i / n) * Math.PI * 2 * (rangeMs > 86400_000 ? 3.5 : 2))
  const slow = Math.sin((i / n) * Math.PI * 0.7 + metric.length)
  const noise = (seeded(i * 7.1 + metric.length * 3.3) - 0.5) * 2
  const amp = base * 0.28
  const trend = ((i / n) ** 2) * (latest - base) // ease toward live value at the tail
  const v = base + trend + wave * amp * 0.6 + slow * amp + noise * amp * 0.5
  return clamp(Math.round(v * 10) / 10, 0, CEIL[metric])
}

export interface SeriesRow {
  t: number
  cpu: number
  ram: number
  disk: number
  net: number
  ping: number
}

const METRICS: MetricKey[] = ['cpu', 'ram', 'disk', 'net', 'ping']

/** Build ~90 evenly-spaced rows across [now-range, now]. Real samples override
 *  the matching bucket; everything older is synthesised from the latest value. */
export function seriesForRange(rangeMs: number, nowMs: number): SeriesRow[] {
  const N = 90
  const step = rangeMs / N
  const latest = buf[buf.length - 1]
  const live: Record<MetricKey, number> = latest
    ? { cpu: latest.cpu, ram: latest.ram, disk: latest.disk, net: latest.net, ping: latest.ping }
    : { ...BASELINE }

  const rows: SeriesRow[] = []
  for (let i = 0; i <= N; i++) {
    const t = nowMs - rangeMs + i * step
    const real = nearestSample(t, step / 2)
    const row: SeriesRow = { t, cpu: 0, ram: 0, disk: 0, net: 0, ping: 0 }
    for (const m of METRICS) {
      row[m] = real ? real[m] : synth(m, i, N, live[m], rangeMs)
    }
    rows.push(row)
  }
  // Guarantee the final point is the freshest reading.
  if (latest) {
    const last = rows[rows.length - 1]
    for (const m of METRICS) last[m] = live[m]
    last.t = latest.t
  }
  return rows
}

function nearestSample(t: number, tol: number): Sample | null {
  let best: Sample | null = null
  let bestD = Infinity
  for (const s of buf) {
    const d = Math.abs(s.t - t)
    if (d < bestD && d <= tol) {
      bestD = d
      best = s
    }
  }
  return best
}
