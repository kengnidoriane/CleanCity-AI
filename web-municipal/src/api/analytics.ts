import { apiClient } from './client'

export interface CityKpis {
  totalActiveReports: number
  collectionRate: number   // percentage 0-100
  activeTrucks: number
  avgResponseTimeMin: number
}

export async function getCityKpis(cityId: string): Promise<CityKpis> {
  const res = await apiClient.get<CityKpis>('/api/analytics/city', {
    params: { cityId },
  })
  return res.data
}
