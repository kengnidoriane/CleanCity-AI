import { useRouter } from 'expo-router'
import ReportScreen from '../../src/screens/ReportScreen'

export default function ReportRoute() {
  const router = useRouter()
  return <ReportScreen onSuccess={() => router.push('/(tabs)/history')} />
}
