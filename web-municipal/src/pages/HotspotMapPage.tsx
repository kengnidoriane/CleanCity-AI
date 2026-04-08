import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  getHotspots,
  intensityToColor,
  intensityLabel,
  type Hotspot,
  type HotspotPeriod,
} from '../api/hotspots'
import { useAuthStore } from '../store/authStore'

// Default center — Dakar, Senegal
const DEFAULT_CENTER: [number, number] = [14.6928, -17.4467]

const PERIOD_OPTIONS: { value: HotspotPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 days' },
  { value: '30days', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
]

const LEGEND_ITEMS = [
  { color: '#ef4444', label: 'High concentration' },
  { color: '#f97316', label: 'Medium-High' },
  { color: '#eab308', label: 'Medium' },
  { color: '#22c55e', label: 'Low concentration' },
]

export default function HotspotMapPage() {
  const user = useAuthStore((s) => s.user)
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [period, setPeriod] = useState<HotspotPeriod>('7days')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHotspots = useCallback(async () => {
    if (!user?.cityId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await getHotspots(user.cityId, period)
      setHotspots(data)
    } catch {
      setError('Failed to load hotspot data.')
    } finally {
      setIsLoading(false)
    }
  }, [user?.cityId, period])

  useEffect(() => {
    void fetchHotspots()
  }, [fetchHotspots])

  return (
    <div className="flex h-full" data-testid="hotspot-map-page">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Waste Hotspots</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {isLoading ? 'Loading...' : `${hotspots.length} zones identified`}
          </p>
        </div>

        {/* Period filter */}
        <div className="px-4 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Period</p>
          <div className="space-y-1" data-testid="period-filter">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                data-testid={`period-${opt.value}`}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === opt.value
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Legend</p>
          <div className="space-y-2">
            {LEGEND_ITEMS.map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Stats summary */}
        {!isLoading && hotspots.length > 0 && (
          <div className="mx-4 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-2">Summary</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total zones</span>
                <span className="font-semibold text-gray-900">{hotspots.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total reports</span>
                <span className="font-semibold text-gray-900">
                  {hotspots.reduce((sum, h) => sum + h.count, 0)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">High-risk zones</span>
                <span className="font-semibold text-red-600">
                  {hotspots.filter((h) => h.intensity >= 0.7).length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative" data-testid="map-container">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
            <p className="text-sm text-gray-500">Loading hotspots...</p>
          </div>
        )}

        {!isLoading && hotspots.length === 0 && !error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 text-center shadow-sm">
              <p className="text-2xl mb-2">🗺️</p>
              <p className="text-sm font-medium text-gray-700">No hotspots found</p>
              <p className="text-xs text-gray-400 mt-1">Try a different period</p>
            </div>
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
          {hotspots.map((hotspot, idx) => {
            const color = intensityToColor(hotspot.intensity)
            // Radius scales with count: min 8, max 30
            const radius = Math.min(8 + hotspot.count * 2, 30)
            return (
              <CircleMarker
                key={idx}
                center={[hotspot.lat, hotspot.lng]}
                radius={radius}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.5,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-sm min-w-[140px]">
                    <p className="font-semibold text-gray-900">
                      {intensityLabel(hotspot.intensity)} concentration
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {hotspot.count} report{hotspot.count !== 1 ? 's' : ''} in this zone
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {hotspot.lat.toFixed(4)}, {hotspot.lng.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}
