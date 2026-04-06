import { useEffect, useState, useCallback } from 'react'
import {
  getAuditTrail,
  downloadAuditCsv,
  STATUS_LABELS,
  STATUS_BADGE,
  WASTE_LABELS,
  SEVERITY_LABELS,
  type AuditReport,
  type AuditFilters,
  type ReportStatus,
} from '../api/audit'
import { useAuthStore } from '../store/authStore'

const PAGE_SIZE = 50

const STATUS_OPTIONS: { value: ReportStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'COLLECTED', label: 'Collected' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}

export default function AuditTrailPage() {
  const user = useAuthStore((s) => s.user)
  const [reports, setReports] = useState<AuditReport[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<AuditFilters>({ status: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAudit = useCallback(async () => {
    if (!user?.cityId) return
    setIsLoading(true)
    setError(null)
    try {
      const result = await getAuditTrail(user.cityId, { ...filters, page, limit: PAGE_SIZE })
      setReports(result.data)
      setTotal(result.total)
    } catch {
      setError('Failed to load audit trail.')
    } finally {
      setIsLoading(false)
    }
  }, [user?.cityId, filters, page])

  useEffect(() => {
    void fetchAudit()
  }, [fetchAudit])

  const handleFilterChange = (key: keyof AuditFilters, value: string) => {
    setPage(1) // reset to first page on filter change
    setFilters((prev) => ({ ...prev, [key]: value || undefined }))
  }

  const handleExport = () => {
    if (!user?.cityId) return
    downloadAuditCsv(user.cityId, { status: filters.status, companyId: filters.companyId })
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const activeFiltersCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="h-full overflow-y-auto bg-gray-50" data-testid="audit-trail-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Audit Trail</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {isLoading ? 'Loading...' : `${total} reports total`}
            </p>
          </div>
          <button
            onClick={handleExport}
            data-testid="btn-export-csv"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <span>⬇</span> Export CSV
          </button>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Filters bar */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filters</p>

          {/* Status */}
          <select
            value={filters.status ?? ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            data-testid="filter-status"
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Reset */}
          {activeFiltersCount > 0 && (
            <button
              onClick={() => { setFilters({ status: '' }); setPage(1) }}
              data-testid="btn-reset-filters"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Reset filters
            </button>
          )}

          <span className="ml-auto text-xs text-gray-400">
            Page {page} of {totalPages || 1}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center" role="alert">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Table */}
        {!error && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" data-testid="audit-table">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Size</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Company</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Collected</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                      Loading...
                    </td>
                  </tr>
                )}
                {!isLoading && reports.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                      No reports found.
                    </td>
                  </tr>
                )}
                {!isLoading && reports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                    data-testid={`audit-row-${report.id}`}
                  >
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatDate(report.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {formatCoords(report.latitude, report.longitude)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {WASTE_LABELS[report.wasteType]}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {SEVERITY_LABELS[report.severity]}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[report.status]}`}>
                        {STATUS_LABELS[report.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {report.companyId ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {report.collectedAt ? formatDate(report.collectedAt) : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2" data-testid="pagination">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              data-testid="btn-prev-page"
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <span className="text-xs text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              data-testid="btn-next-page"
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
