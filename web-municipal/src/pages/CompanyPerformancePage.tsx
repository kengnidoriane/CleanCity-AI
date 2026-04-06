import { useEffect, useState, useCallback } from 'react'
import {
  getCompanyPerformance,
  sortCompanies,
  rateColor,
  type CompanyPerformance,
  type SortKey,
  type SortDir,
} from '../api/companies'
import { useAuthStore } from '../store/authStore'

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'collectionRate', label: 'Collection Rate' },
  { key: 'activeTrucks', label: 'Active Trucks' },
  { key: 'avgResponseTimeMin', label: 'Avg Response' },
  { key: 'totalReports', label: 'Total Reports' },
]

interface SortIndicatorProps {
  column: SortKey
  sortKey: SortKey
  sortDir: SortDir
}

function SortIndicator({ column, sortKey, sortDir }: SortIndicatorProps) {
  if (column !== sortKey) return <span className="text-gray-300 ml-1">↕</span>
  return <span className="text-blue-600 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
}

export default function CompanyPerformancePage() {
  const user = useAuthStore((s) => s.user)
  const [companies, setCompanies] = useState<CompanyPerformance[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('collectionRate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanies = useCallback(async () => {
    if (!user?.cityId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await getCompanyPerformance(user.cityId)
      setCompanies(data)
    } catch {
      setError('Failed to load company performance data.')
    } finally {
      setIsLoading(false)
    }
  }, [user?.cityId])

  useEffect(() => {
    void fetchCompanies()
  }, [fetchCompanies])

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = sortCompanies(companies, sortKey, sortDir)
  const selected = sorted.find((c) => c.id === selectedId) ?? null

  return (
    <div className="h-full overflow-y-auto bg-gray-50" data-testid="company-performance-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-base font-bold text-gray-900">Company Performance</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {isLoading ? 'Loading...' : `${companies.length} active companies — sorted by ${sortKey}`}
        </p>
      </div>

      <div className="px-6 py-6 space-y-4">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center" role="alert">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400">Loading companies...</p>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" data-testid="companies-table">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                    Company
                  </th>
                  {COLUMNS.map(({ key, label }) => (
                    <th
                      key={key}
                      className="text-right px-5 py-3 text-xs font-semibold text-gray-500 cursor-pointer select-none hover:text-gray-800 transition-colors"
                      onClick={() => handleSort(key)}
                      data-testid={`sort-${key}`}
                    >
                      {label}
                      <SortIndicator column={key} sortKey={sortKey} sortDir={sortDir} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                      No companies found for this city.
                    </td>
                  </tr>
                )}
                {sorted.map((company, idx) => (
                  <tr
                    key={company.id}
                    onClick={() => setSelectedId(company.id === selectedId ? null : company.id)}
                    className={`border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${
                      selectedId === company.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    data-testid={`company-row-${company.id}`}
                  >
                    {/* Rank + Name */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-500 flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-gray-900">{company.name}</span>
                      </div>
                    </td>
                    {/* Collection Rate */}
                    <td className="px-5 py-3 text-right">
                      <span className={`font-semibold ${rateColor(company.collectionRate)}`}>
                        {company.collectionRate}%
                      </span>
                    </td>
                    {/* Active Trucks */}
                    <td className="px-5 py-3 text-right font-medium text-gray-700">
                      {company.activeTrucks}
                    </td>
                    {/* Avg Response */}
                    <td className="px-5 py-3 text-right text-gray-600">
                      {company.avgResponseTimeMin} min
                    </td>
                    {/* Total Reports */}
                    <td className="px-5 py-3 text-right text-gray-500">
                      {company.totalReports}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail panel — shown when a company is selected */}
        {selected && (
          <div
            className="bg-white rounded-xl border border-blue-200 p-5"
            data-testid="company-detail"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">{selected.name}</h2>
              <button
                onClick={() => setSelectedId(null)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close detail panel"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Collection Rate', value: `${selected.collectionRate}%`, color: rateColor(selected.collectionRate) },
                { label: 'Active Trucks', value: String(selected.activeTrucks), color: 'text-gray-900' },
                { label: 'Avg Response', value: `${selected.avgResponseTimeMin} min`, color: 'text-gray-900' },
                { label: 'Total Reports', value: String(selected.totalReports), color: 'text-gray-900' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-400">
              {selected.collected} / {selected.totalReports} reports collected
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
