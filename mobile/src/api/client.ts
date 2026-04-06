import axios from 'axios'

// Base URL points to the backend — update with your local IP when testing on device
const API_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request if available
apiClient.interceptors.request.use((config) => {
  const token = (globalThis as Record<string, unknown>)['__authToken'] as string | undefined
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})
