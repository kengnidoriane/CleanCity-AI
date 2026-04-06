import { apiClient } from './client'

export type Period = 'day' | 'week' | 'month'

export interface PeriodStats {
  totalReports: number
  collected: number
  pending: number
  collectionRate: number  // percentage 0-100
  totalDistanceKm: number
}

export interface CompanyStats {
  period: Period
  current: PeriodStats
  previous: PeriodStats
}

export async function getCompanyStats(companyId: string, period: Period): Promise<CompanyStats> {
  const res = await apiClient.get<CompanyStats>('/api/analytics/company', {
    params: { companyId, period },
  })
  return res.data
}

/** Returns the signed difference and direction for a metric */
export function getDelta(current: number, previous: number): { value: number; isPositive: boolean } {
  const value = current - previous
  return { value, isPositive: value >= 0 }
}
