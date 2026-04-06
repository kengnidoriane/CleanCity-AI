import { apiClient } from './client'

export type ReportStatus = 'PENDING' | 'ASSIGNED' | 'COLLECTED'
export type WasteType = 'PLASTIC' | 'ORGANIC' | 'BULKY' | 'ELECTRONIC' | 'HAZARDOUS' | 'OTHER'
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH'

export interface AuditReport {
  id: string
  latitude: number
  longitude: number
  wasteType: WasteType
  severity: Severity
  status: ReportStatus
  photoUrl: string
  companyId: string | null
  collectedAt: string | null
  createdAt: string
  cityId: string
}

export interface AuditFilters {
  status?: ReportStatus | ''
  companyId?: string
  page?: number
  limit?: number
}

export interface AuditPage {
  data: AuditReport[]
  total: number
  page: number
  limit: number
}

export async function getAuditTrail(cityId: string, filters: AuditFilters = {}): Promise<AuditPage> {
  const params: Record<string, string | number> = { cityId }
  if (filters.status) params['status'] = filters.status
  if (filters.companyId) params['companyId'] = filters.companyId
  if (filters.page) params['page'] = filters.page
  if (filters.limit) params['limit'] = filters.limit

  const res = await apiClient.get<AuditPage>('/api/reports/audit', { params })
  return res.data
}

/** Triggers a CSV download by navigating to the export URL with auth token */
export function downloadAuditCsv(cityId: string, filters: Pick<AuditFilters, 'status' | 'companyId'>): void {
  const token = localStorage.getItem('auth_token') ?? ''
  const params = new URLSearchParams({ cityId })
  if (filters.status) params.set('status', filters.status)
  if (filters.companyId) params.set('companyId', filters.companyId)

  // Use apiClient base URL for the download link
  const baseUrl = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:3000'
  const url = `${baseUrl}/api/reports/audit/export?${params.toString()}`

  // Create a temporary anchor to trigger download with auth header via fetch
  void fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => res.blob())
    .then((blob) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
    })
}

export const STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  COLLECTED: 'Collected',
}

export const STATUS_BADGE: Record<ReportStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  ASSIGNED: 'bg-amber-100 text-amber-700',
  COLLECTED: 'bg-green-100 text-green-700',
}

export const WASTE_LABELS: Record<WasteType, string> = {
  PLASTIC: 'Plastic',
  ORGANIC: 'Organic',
  BULKY: 'Bulky',
  ELECTRONIC: 'Electronic',
  HAZARDOUS: 'Hazardous',
  OTHER: 'Other',
}

export const SEVERITY_LABELS: Record<Severity, string> = {
  LOW: 'Small',
  MEDIUM: 'Medium',
  HIGH: 'Large',
}
