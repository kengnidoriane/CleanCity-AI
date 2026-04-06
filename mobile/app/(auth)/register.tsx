import { useRouter } from 'expo-router'
import { useAuthStore } from '../../src/store/authStore'
import RegisterScreen from '../../src/screens/RegisterScreen'

export default function RegisterRoute() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  return (
    <RegisterScreen
      defaultCityId={user?.cityId ?? ''}
      onSuccess={() => router.replace('/(tabs)')}
      onLoginPress={() => router.back()}
    />
  )
}
