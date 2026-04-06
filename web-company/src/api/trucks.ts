import { apiClient } from './client'

export interface Truck {
  id: string
  name: string
  currentLat: number | null
  currentLng: number | null
  completionPercent: number
  etaMinutes: number | null
  activeRouteId: string | null
  driver: { user: { name: string } } | null
}

export async function getActiveTrucks(cityId: string): Promise<Truck[]> {
  const res = await apiClient.get<Truck[]>('/api/trucks/active', { params: { cityId } })
  return res.data
}
