import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useAuthStore } from '../src/store/authStore'

/**
 * Root layout — handles auth guard and initial token loading.
 * Redirects to /login if not authenticated, to /(tabs) if authenticated.
 */
export default function RootLayout() {
  const router = useRouter()
  const segments = useSegments()
  const { token, isLoading, loadFromStorage } = useAuthStore()

  // Load persisted auth token on app start
  useEffect(() => {
    loadFromStorage()
  }, [])

  // Auth guard — redirect based on auth state
  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!token && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (token && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [token, isLoading, segments])

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}
