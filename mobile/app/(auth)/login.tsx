import { useRouter } from 'expo-router'
import LoginScreen from '../../src/screens/LoginScreen'

export default function LoginRoute() {
  const router = useRouter()
  return (
    <LoginScreen
      onSuccess={() => router.replace('/(tabs)')}
      onRegisterPress={() => router.push('/(auth)/register')}
    />
  )
}
