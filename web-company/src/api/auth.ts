import { apiClient } from './client'

export interface AuthUser {
  id: string
  name: string
  email: string | null
  role: 'COMPANY'
  cityId: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

export async function loginCompany(email: string, password: string): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>('/api/auth/login/company', { email, password })
  return res.data
}
