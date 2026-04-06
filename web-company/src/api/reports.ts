import { apiClient } from './client'

export type WasteType = 'PLASTIC' | 'ORGANIC' | 'BULKY' | 'ELECTRONIC' | 'HAZARDOUS' | 'OTHER'
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH'
export type ReportStatus = 'PENDING' | 'ASSIGNED' | 'COLLECTED'

export interface Report {
  id: string
  latitude: number
  longitude: number
  wasteType: WasteType
  severity: Severity
  status: ReportStatus
  photoUrl: string
  companyId: string | null
  createdAt: string
  collectedAt: string | null
}

export interface ReportFilters {
  status?: ReportStatus
  wasteType?: WasteType
  severity?: Severity
}

export async function getCityReports(cityId: string, filters?: ReportFilters): Promise<Report[]> {
  const res = await apiClient.get<Report[]>('/api/reports/city', {
    params: { cityId, ...filters },
  })
  return res.data
}

// Severity → map color (matches user story: green=LOW, yellow=MEDIUM, red=HIGH)
export const SEVERITY_COLOR: Record<Severity, string> = {
  LOW: '#16a34a',
  MEDIUM: '#d97706',
  HIGH: '#dc2626',
}

export const WASTE_LABELS: Record<WasteType, string> = {
  PLASTIC: 'Plastic',
  ORGANIC: 'Organic',
  BULKY: 'Bulky',
  ELECTRONIC: 'Electronic',
  HAZARDOUS: 'Hazardous',
  OTHER: 'Other',
}
