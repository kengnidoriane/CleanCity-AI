import { apiClient } from './client'

export interface Truck {
  id: string
  name: string
  currentLat: number | null
  currentLng: number | null
  completionPercent: number
  etaMinutes: number | null
  activeRouteId: string | null
  companyId: string
  companyName: string
  driver: { user: { name: string } } | null
}

export async function getCityTrucks(cityId: string): Promise<Truck[]> {
  const res = await apiClient.get<Truck[]>('/api/trucks/active', { params: { cityId } })
  return res.data
}

// Deterministic color palette for company distinction
const COMPANY_COLORS = [
  '#2563eb', // blue
  '#16a34a', // green
  '#d97706', // amber
  '#9333ea', // purple
  '#dc2626', // red
  '#0891b2', // cyan
  '#c2410c', // orange
  '#4f46e5', // indigo
]

const _colorMap = new Map<string, string>()
let _colorIndex = 0

/** Returns a stable color for a given companyId */
export function getCompanyColor(companyId: string): string {
  if (!_colorMap.has(companyId)) {
    _colorMap.set(companyId, COMPANY_COLORS[_colorIndex % COMPANY_COLORS.length])
    _colorIndex++
  }
  return _colorMap.get(companyId)!
}

/** Reset color assignments (useful for tests) */
export function resetColorMap(): void {
  _colorMap.clear()
  _colorIndex = 0
}
