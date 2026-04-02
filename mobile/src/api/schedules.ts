import { apiClient } from './client'

export interface Schedule {
  id: string
  zone: string
  dayOfWeek: number  // 0=Sunday, 1=Monday, ..., 6=Saturday
  timeWindowStart: string  // "HH:MM"
  timeWindowEnd: string    // "HH:MM"
  companyId: string
  cityId: string
}

/**
 * Fetch collection schedules for a city, optionally filtered by zone.
 */
export async function getSchedules(cityId: string, zone?: string): Promise<Schedule[]> {
  const params: Record<string, string> = { cityId }
  if (zone) params['zone'] = zone
  const res = await apiClient.get<Schedule[]>('/api/schedules', { params })
  return res.data
}
