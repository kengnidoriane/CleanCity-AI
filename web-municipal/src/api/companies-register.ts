import { apiClient } from './client'

export interface RegisterCompanyInput {
  name: string
  email: string
  phone?: string
  cityId: string
}

export interface RegisteredCompany {
  id: string
  name: string
  email: string
  phone: string | null
  cityId: string
  createdAt: string
}

export interface RegisterCompanyResponse {
  company: RegisteredCompany
  message: string
}

export async function registerCompany(input: RegisterCompanyInput): Promise<RegisterCompanyResponse> {
  const res = await apiClient.post<RegisterCompanyResponse>('/api/companies', input)
  return res.data
}
