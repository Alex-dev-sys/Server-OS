import { useEffect, useMemo, useSyncExternalStore } from 'react'
import {
  getSampleCount,
  seriesForRange,
  startMetricHistory,
  subscribeHistory,
  type SeriesRow,
} from '@/services/metricHistory'

/** Live metric history for a given time range. Re-renders on every new sample
 *  (the engine tick) so the chart tail advances in real time. */
export function useMetricHistory(rangeMs: number): SeriesRow[] {
  useEffect(() => {
    startMetricHistory()
  }, [])

  // Bump on every ingested sample.
  const count = useSyncExternalStore(subscribeHistory, getSampleCount, getSampleCount)

  return useMemo(
    () => seriesForRange(rangeMs, Date.now()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rangeMs, count],
  )
}
