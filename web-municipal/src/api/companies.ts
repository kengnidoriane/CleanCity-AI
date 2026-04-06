import { apiClient } from './client'

export interface CompanyPerformance {
  id: string
  name: string
  totalReports: number
  collected: number
  collectionRate: number   // percentage 0-100
  activeTrucks: number
  avgResponseTimeMin: number
}

export type SortKey = 'collectionRate' | 'activeTrucks' | 'avgResponseTimeMin' | 'totalReports'
export type SortDir = 'asc' | 'desc'

export async function getCompanyPerformance(cityId: string): Promise<CompanyPerformance[]> {
  const res = await apiClient.get<CompanyPerformance[]>('/api/analytics/city/companies', {
    params: { cityId },
  })
  return res.data
}

export function sortCompanies(
  companies: CompanyPerformance[],
  key: SortKey,
  dir: SortDir
): CompanyPerformance[] {
  return [...companies].sort((a, b) => {
    const diff = a[key] - b[key]
    return dir === 'asc' ? diff : -diff
  })
}

/** Returns a Tailwind color class based on collection rate */
export function rateColor(rate: number): string {
  if (rate >= 75) return 'text-green-600'
  if (rate >= 50) return 'text-amber-600'
  return 'text-red-500'
}
