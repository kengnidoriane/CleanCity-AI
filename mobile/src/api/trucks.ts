import { apiClient } from './client'

export interface ActiveTruck {
  id: string
  name: string
  currentLat: number | null
  currentLng: number | null
  completionPercent: number
  etaMinutes: number | null
  driver: { user: { name: string } } | null
}

export interface TruckPositionUpdate {
  truckId: string
  lat: number
  lng: number
  completionPercent: number
  lastUpdated: string
}

export async function getActiveTrucks(cityId: string): Promise<ActiveTruck[]> {
  const res = await apiClient.get<ActiveTruck[]>('/api/trucks/active', {
    params: { cityId },
  })
  return res.data
}
