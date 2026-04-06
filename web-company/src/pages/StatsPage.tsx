import { useEffect, useState } from 'react'
import { getCompanyStats, getDelta, type CompanyStats, type Period } from '../api/analytics'
import { useAuthStore } from '../store/authStore'

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
]

interface KpiCardProps {
  label: string
  icon: string
  value: string
  delta: number
  isPositive: boolean
  unit?: string
}

function KpiCard({ label, icon, value, delta, isPositive, unit }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" data-testid={`kpi-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {value}{unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
      </p>
      <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
        <span>{isPositive ? '↑' : '↓'}</span>
        <span>{Math.abs(delta)}{unit ?? ''} vs previous period</span>
      </div>
    </div>
  )
}

export default function StatsPage() {
  const user = useAuthStore((s) => s.user)
  const [stats, setStats] = useState<CompanyStats | null>(null)
  const [period, setPeriod] = useState<Period>('week')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return
    const fetchStats = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getCompanyStats(user.id, period)
        setStats(data)
      } catch {
        setError('Failed to load statistics.')
      } finally {
        setIsLoading(false)
      }
    }
    void fetchStats()
  }, [user?.id, period])

  return (
    <div className="h-full overflow-y-auto bg-gray-50" data-testid="stats-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Performance Statistics</h1>
            <p className="text-xs text-gray-400 mt-0.5">Compare your performance across periods</p>
          </div>

          {/* Period selector */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  period === opt.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                data-testid={`period-${opt.value}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">Loading statistics...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {stats && !isLoading && (
          <>
            {/* KPI grid */}
            <div className="grid grid-cols-2 gap-4 mb-6" data-testid="kpi-grid">
              <KpiCard
                label="Total Reports"
                icon="📋"
                value={String(stats.current.totalReports)}
                delta={getDelta(stats.current.totalReports, stats.previous.totalReports).value}
                isPositive={getDelta(stats.current.totalReports, stats.previous.totalReports).isPositive}
              />
              <KpiCard
                label="Collected"
                icon="✅"
                value={String(stats.current.collected)}
                delta={getDelta(stats.current.collected, stats.previous.collected).value}
                isPositive={getDelta(stats.current.collected, stats.previous.collected).isPositive}
              />
              <KpiCard
                label="Collection Rate"
                icon="📊"
                value={`${stats.current.collectionRate}`}
                unit="%"
                delta={getDelta(stats.current.collectionRate, stats.previous.collectionRate).value}
                isPositive={getDelta(stats.current.collectionRate, stats.previous.collectionRate).isPositive}
              />
              <KpiCard
                label="Total Distance"
                icon="🛣️"
                value={stats.current.totalDistanceKm.toFixed(1)}
                unit="km"
                delta={parseFloat(getDelta(stats.current.totalDistanceKm, stats.previous.totalDistanceKm).value.toFixed(1))}
                isPositive={getDelta(stats.current.totalDistanceKm, stats.previous.totalDistanceKm).isPositive}
              />
            </div>

            {/* Comparison table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Period Comparison</p>
              </div>
              <table className="w-full text-sm" data-testid="comparison-table">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Metric</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Current</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Previous</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Total Reports', current: stats.current.totalReports, previous: stats.previous.totalReports },
                    { label: 'Collected', current: stats.current.collected, previous: stats.previous.collected },
                    { label: 'Pending', current: stats.current.pending, previous: stats.previous.pending },
                    { label: 'Collection Rate', current: `${stats.current.collectionRate}%`, previous: `${stats.previous.collectionRate}%` },
                    { label: 'Distance (km)', current: stats.current.totalDistanceKm.toFixed(1), previous: stats.previous.totalDistanceKm.toFixed(1) },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3 text-gray-600">{row.label}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">{row.current}</td>
                      <td className="px-5 py-3 text-right text-gray-400">{row.previous}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
