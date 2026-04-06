import { useEffect, useState } from 'react'
import { getCityKpis, type CityKpis } from '../api/analytics'
import { useAuthStore } from '../store/authStore'

interface KpiCardProps {
  label: string
  icon: string
  value: string
  unit?: string
  description: string
}

function KpiCard({ label, icon, value, unit, description }: KpiCardProps) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-5"
      data-testid={`kpi-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        {unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
      </p>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  )
}

export default function KpiDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [kpis, setKpis] = useState<CityKpis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.cityId) return
    const fetchKpis = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getCityKpis(user.cityId)
        setKpis(data)
      } catch {
        setError('Failed to load city KPIs.')
      } finally {
        setIsLoading(false)
      }
    }
    void fetchKpis()
  }, [user?.cityId])

  return (
    <div className="h-full overflow-y-auto bg-gray-50" data-testid="kpi-dashboard">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-base font-bold text-gray-900">City KPI Dashboard</h1>
        <p className="text-xs text-gray-400 mt-0.5">Real-time overview of city waste management</p>
      </div>

      <div className="px-6 py-6">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">Loading KPIs...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center" role="alert">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {kpis && !isLoading && (
          <div className="grid grid-cols-2 gap-4" data-testid="kpi-grid">
            <KpiCard
              label="Active Reports"
              icon="📋"
              value={String(kpis.totalActiveReports)}
              description="Pending waste reports in the city"
            />
            <KpiCard
              label="Collection Rate"
              icon="✅"
              value={`${kpis.collectionRate}`}
              unit="%"
              description="Reports resolved this period"
            />
            <KpiCard
              label="Active Trucks"
              icon="🚛"
              value={String(kpis.activeTrucks)}
              description="Trucks currently on route"
            />
            <KpiCard
              label="Avg Response Time"
              icon="⏱️"
              value={`${kpis.avgResponseTimeMin}`}
              unit="min"
              description="Average time to first collection"
            />
          </div>
        )}
      </div>
    </div>
  )
}
