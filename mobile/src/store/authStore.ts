import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface User {
  id: string
  name: string
  phone: string
  role: string
  cityId: string
}

interface AuthState {
  token: string | null
  user: User | null
  isLoading: boolean
  setAuth: (token: string, user: User) => Promise<void>
  logout: () => Promise<void>
  loadFromStorage: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,

  setAuth: async (token, user) => {
    await AsyncStorage.setItem('auth_token', token)
    await AsyncStorage.setItem('auth_user', JSON.stringify(user))
    // Make token available to axios interceptor
    ;(globalThis as Record<string, unknown>)['__authToken'] = token
    set({ token, user })
  },

  logout: async () => {
    await AsyncStorage.removeItem('auth_token')
    await AsyncStorage.removeItem('auth_user')
    ;(globalThis as Record<string, unknown>)['__authToken'] = undefined
    set({ token: null, user: null })
  },

  loadFromStorage: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token')
      const userJson = await AsyncStorage.getItem('auth_user')
      if (token && userJson) {
        const user = JSON.parse(userJson) as User
        ;(globalThis as Record<string, unknown>)['__authToken'] = token
        set({ token, user })
      }
    } finally {
      set({ isLoading: false })
    }
  },
}))
