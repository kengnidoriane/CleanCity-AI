import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  getCityReports,
  SEVERITY_COLOR,
  WASTE_LABELS,
  type Report,
  type ReportFilters,
  type ReportStatus,
  type WasteType,
  type Severity,
} from '../api/reports'
import { useAuthStore } from '../store/authStore'

// Default center — Dakar, Senegal
const DEFAULT_CENTER: [number, number] = [14.6928, -17.4467]

const STATUS_OPTIONS: { value: ReportStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'COLLECTED', label: 'Collected' },
]

const WASTE_OPTIONS: { value: WasteType | ''; label: string }[] = [
  { value: '', label: 'All categories' },
  { value: 'PLASTIC', label: 'Plastic' },
  { value: 'ORGANIC', label: 'Organic' },
  { value: 'BULKY', label: 'Bulky' },
  { value: 'ELECTRONIC', label: 'Electronic' },
  { value: 'HAZARDOUS', label: 'Hazardous' },
  { value: 'OTHER', label: 'Other' },
]

const SEVERITY_OPTIONS: { value: Severity | ''; label: string }[] = [
  { value: '', label: 'All sizes' },
  { value: 'LOW', label: 'Small' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'Large' },
]

const STATUS_BADGE: Record<ReportStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  ASSIGNED: 'bg-amber-100 text-amber-700',
  COLLECTED: 'bg-green-100 text-green-700',
}

export default function ReportsMapPage() {
  const user = useAuthStore((s) => s.user)
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<ReportFilters>({})
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  const fetchReports = useCallback(async () => {
    if (!user?.cityId) return
    setIsLoading(true)
    try {
      const data = await getCityReports(user.cityId, filters)
      setReports(data)
    } finally {
      setIsLoading(false)
    }
  }, [user?.cityId, filters])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }))
  }

  const resetFilters = () => setFilters({})

  const activeFiltersCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="flex h-full" data-testid="reports-map-page">
      {/* Filter sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Reports</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isLoading ? 'Loading...' : `${reports.length} reports`}
            </p>
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-xs text-green-600 hover:text-green-700 font-medium"
              data-testid="btn-reset-filters"
            >
              Reset ({activeFiltersCount})
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="px-4 py-4 space-y-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filters</p>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
            <select
              value={filters.status ?? ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200"
              data-testid="filter-status"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
            <select
              value={filters.wasteType ?? ''}
              onChange={(e) => handleFilterChange('wasteType', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200"
              data-testid="filter-waste-type"
            >
              {WASTE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Size</label>
            <select
              value={filters.severity ?? ''}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200"
              data-testid="filter-severity"
            >
              {SEVERITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Legend</p>
          <div className="space-y-2">
            {(['LOW', 'MEDIUM', 'HIGH'] as Severity[]).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: SEVERITY_COLOR[s] }}
                />
                <span className="text-xs text-gray-600">
                  {s === 'LOW' ? 'Small' : s === 'MEDIUM' ? 'Medium' : 'Large'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected report detail */}
        {selectedReport && (
          <div className="mx-4 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700">
                {WASTE_LABELS[selectedReport.wasteType]}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[selectedReport.status]}`}>
                {selectedReport.status}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {new Date(selectedReport.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </p>
            {selectedReport.photoUrl && (
              <img
                src={selectedReport.photoUrl}
                alt="Waste report"
                className="mt-2 w-full h-24 object-cover rounded-md"
              />
            )}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative" data-testid="map-container">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
            <div className="text-sm text-gray-500">Loading reports...</div>
          </div>
        )}
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {reports.map((report) => (
            <CircleMarker
              key={report.id}
              center={[report.latitude, report.longitude]}
              radius={report.severity === 'HIGH' ? 12 : report.severity === 'MEDIUM' ? 9 : 7}
              pathOptions={{
                color: SEVERITY_COLOR[report.severity],
                fillColor: SEVERITY_COLOR[report.severity],
                fillOpacity: 0.7,
                weight: 2,
              }}
              eventHandlers={{ click: () => setSelectedReport(report) }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{WASTE_LABELS[report.wasteType]}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{report.status}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
