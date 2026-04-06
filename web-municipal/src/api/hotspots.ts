import { apiClient } from './client'

export interface Hotspot {
  lat: number
  lng: number
  count: number
  intensity: number  // 0-1, used for color interpolation
}

export type HotspotPeriod = 'today' | '7days' | '30days' | 'all'

// Map UI period labels to backend period values (days)
const PERIOD_DAYS: Record<HotspotPeriod, number | undefined> = {
  today: 1,
  '7days': 7,
  '30days': 30,
  all: undefined,
}

export async function getHotspots(cityId: string, period: HotspotPeriod): Promise<Hotspot[]> {
  const days = PERIOD_DAYS[period]
  const res = await apiClient.get<Hotspot[]>('/api/analytics/hotspots', {
    params: { cityId, ...(days !== undefined ? { period: days } : {}) },
  })
  return res.data
}

/**
 * Interpolates intensity (0-1) to a color:
 * 0.0 → green (#22c55e)
 * 0.5 → yellow (#eab308)
 * 1.0 → red (#ef4444)
 */
export function intensityToColor(intensity: number): string {
  if (intensity >= 0.7) return '#ef4444'   // red
  if (intensity >= 0.4) return '#f97316'   // orange
  if (intensity >= 0.2) return '#eab308'   // yellow
  return '#22c55e'                          // green
}

export function intensityLabel(intensity: number): string {
  if (intensity >= 0.7) return 'High'
  if (intensity >= 0.4) return 'Medium-High'
  if (intensity >= 0.2) return 'Medium'
  return 'Low'
}
