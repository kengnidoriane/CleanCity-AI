import { apiClient } from './client'
import type { Report } from './reports'

export interface RouteStop {
  reportId: string
  reportIds: string[]  // cluster of report IDs at this stop
  lat: number
  lng: number
  severity: string
  collected: boolean
}

export interface OptimizedRoute {
  id: string
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED'
  stopSequence: RouteStop[]
  totalDistanceKm: number | null
  estimatedDurationMin: number | null
  truckId: string | null
  companyId: string
  createdAt: string
}

export interface OptimizeInput {
  cityId: string
  reportIds: string[]
  stops: Array<{
    reportId: string
    lat: number
    lng: number
    severity: string
  }>
}

/**
 * Build optimize input from a list of reports.
 * Groups reports within 100m into clusters (handled server-side).
 */
export function buildOptimizeInput(cityId: string, reports: Report[]): OptimizeInput {
  return {
    cityId,
    reportIds: reports.map((r) => r.id),
    stops: reports.map((r) => ({
      reportId: r.id,
      lat: r.latitude,
      lng: r.longitude,
      severity: r.severity,
    })),
  }
}

export async function optimizeRoute(input: OptimizeInput): Promise<OptimizedRoute> {
  const res = await apiClient.post<OptimizedRoute>('/api/routes/optimize', input)
  return res.data
}

export async function assignRoute(routeId: string, truckId: string): Promise<OptimizedRoute> {
  const res = await apiClient.post<OptimizedRoute>(`/api/routes/${routeId}/assign`, { truckId })
  return res.data
}
