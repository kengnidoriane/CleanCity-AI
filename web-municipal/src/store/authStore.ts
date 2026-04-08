import { create } from 'zustand'
import type { AuthUser } from '../api/auth'

interface AuthState {
  token: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  logout: () => void
  loadFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,

  setAuth: (token, user) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    set({ token: null, user: null })
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('auth_token')
    const userJson = localStorage.getItem('auth_user')
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as AuthUser
        set({ token, user })
      } catch {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }
  },
}))
