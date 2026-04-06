import { apiClient } from './client'

export interface RegisterPayload {
  name: string
  phone: string
  password: string
  cityId: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    name: string
    phone: string
    role: string
    cityId: string
  }
}

export async function registerCitizen(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/auth/register', payload)
  return res.data
}

export async function loginCitizen(phone: string, password: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/auth/login', { phone, password })
  return res.data
}
