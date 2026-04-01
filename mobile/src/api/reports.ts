import { apiClient } from './client'

export type WasteType = 'PLASTIC' | 'ORGANIC' | 'BULKY' | 'ELECTRONIC' | 'HAZARDOUS' | 'OTHER'
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH'

export interface CreateReportPayload {
  latitude: number
  longitude: number
  wasteType: WasteType
  severity: Severity
  cityId: string
  photo: {
    uri: string
    name: string
    type: string
  }
}

export interface Report {
  id: string
  status: 'PENDING' | 'ASSIGNED' | 'COLLECTED'
  wasteType: WasteType
  severity: Severity
  latitude: number
  longitude: number
  photoUrl: string
  createdAt: string
}

export async function submitReport(payload: CreateReportPayload): Promise<Report> {
  const form = new FormData()
  form.append('latitude', String(payload.latitude))
  form.append('longitude', String(payload.longitude))
  form.append('wasteType', payload.wasteType)
  form.append('severity', payload.severity)
  form.append('cityId', payload.cityId)
  form.append('photo', payload.photo as unknown as Blob)

  const res = await apiClient.post<Report>('/api/reports', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
