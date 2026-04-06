import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface Props {
  children: React.ReactNode
}

/**
 * Loads persisted auth on mount, then redirects to /login if unauthenticated.
 */
export default function AuthGuard({ children }: Props) {
  const navigate = useNavigate()
  const { token, loadFromStorage } = useAuthStore()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    // After storage is loaded, redirect if still no token
    if (token === null && !localStorage.getItem('auth_token')) {
      navigate('/login', { replace: true })
    }
  }, [token, navigate])

  // Show nothing while checking auth — avoids flash of protected content
  if (!token && !localStorage.getItem('auth_token')) return null

  return <>{children}</>
}
