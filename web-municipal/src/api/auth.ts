import { apiClient } from './client'

export interface AuthUser {
  id: string
  name: string
  email: string | null
  role: 'MUNICIPAL'
  cityId: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

export async function loginMunicipal(email: string, password: string): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>('/api/auth/login/municipal', { email, password })
  return res.data
}
