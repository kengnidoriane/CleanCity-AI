import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getCityReports, SEVERITY_COLOR, type Report } from '../api/reports'
import { optimizeRoute, assignRoute, buildOptimizeInput, type OptimizedRoute } from '../api/routes'
import { getActiveTrucks, type Truck } from '../api/trucks'
import { useAuthStore } from '../store/authStore'

const DEFAULT_CENTER: [number, number] = [14.6928, -17.4467]

export default function RouteOptimizerPage() {
  const user = useAuthStore((s) => s.user)
  const [reports, setReports] = useState<Report[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [route, setRoute] = useState<OptimizedRoute | null>(null)
  const [selectedTruckId, setSelectedTruckId] = useState<string>('')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.cityId) return
    // Load pending reports and available trucks
    Promise.all([
      getCityReports(user.cityId, { status: 'PENDING' }),
      getActiveTrucks(user.cityId),
    ]).then(([r, t]) => {
      setReports(r)
      setTrucks(t)
    })
  }, [user?.cityId])

  const handleOptimize = async () => {
    if (!user?.cityId || reports.length === 0) return
    setIsOptimizing(true)
    setError(null)
    setRoute(null)
    try {
      const input = buildOptimizeInput(user.cityId, reports)
      const result = await optimizeRoute(input)
      setRoute(result)
    } catch {
      setError('Failed to generate route. Make sure the AI service is running.')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleAssign = async () => {
    if (!route || !selectedTruckId) return
    setIsAssigning(true)
    setError(null)
    try {
      await assignRoute(route.id, selectedTruckId)
      setSuccessMessage(`Route assigned to ${trucks.find((t) => t.id === selectedTruckId)?.name ?? 'truck'}.`)
      setRoute(null)
    } catch {
      setError('Failed to assign route. Please try again.')
    } finally {
      setIsAssigning(false)
    }
  }

  // Build polyline from stop sequence
  const routePolyline: [number, number][] = route?.stopSequence.map((s) => [s.lat, s.lng]) ?? []

  return (
    <div className="flex h-full" data-testid="route-optimizer-page">
      {/* Control panel */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Route Optimizer</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {reports.length} pending reports · {trucks.length} trucks available
          </p>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Generate button */}
          <button
            onClick={handleOptimize}
            disabled={isOptimizing || reports.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
              text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors"
            data-testid="btn-optimize"
          >
            {isOptimizing ? 'Optimizing with OR-Tools...' : '⚡ Generate Optimized Route'}
          </button>

          {/* Route result */}
          {route && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2" data-testid="route-result">
              <p className="text-xs font-semibold text-green-800">Route Generated</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
                <div>
                  <p className="text-green-500">Stops</p>
                  <p className="font-semibold">{route.stopSequence.length}</p>
                </div>
                <div>
                  <p className="text-green-500">Distance</p>
                  <p className="font-semibold">{route.totalDistanceKm?.toFixed(1) ?? '—'} km</p>
                </div>
                <div>
                  <p className="text-green-500">Duration</p>
                  <p className="font-semibold">{route.estimatedDurationMin ?? '—'} min</p>
                </div>
              </div>

              {/* Truck assignment */}
              <div className="pt-2 border-t border-green-200">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Assign to truck
                </label>
                <select
                  value={selectedTruckId}
                  onChange={(e) => setSelectedTruckId(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-green-500"
                  data-testid="select-truck"
                >
                  <option value="">Select a truck...</option>
                  {trucks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}{t.driver ? ` — ${t.driver.user.name}` : ''}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssign}
                  disabled={!selectedTruckId || isAssigning}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                    text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                  data-testid="btn-assign"
                >
                  {isAssigning ? 'Assigning...' : '🚛 Assign Route'}
                </button>
              </div>
            </div>
          )}

          {/* Stop list */}
          {route && route.stopSequence.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Collection Order
              </p>
              <div className="space-y-1.5">
                {route.stopSequence.map((stop, i) => (
                  <div key={stop.reportId} className="flex items-center gap-2.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-gray-600">
                      {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: SEVERITY_COLOR[stop.severity as keyof typeof SEVERITY_COLOR] ?? '#6b7280' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error / success */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5" data-testid="error-message">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5" data-testid="success-message">
              <p className="text-xs text-green-700">{successMessage}</p>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapContainer center={DEFAULT_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Pending reports */}
          {reports.map((r) => (
            <CircleMarker
              key={r.id}
              center={[r.latitude, r.longitude]}
              radius={7}
              pathOptions={{
                color: SEVERITY_COLOR[r.severity],
                fillColor: SEVERITY_COLOR[r.severity],
                fillOpacity: route ? 0.3 : 0.7,
                weight: 1.5,
              }}
            />
          ))}

          {/* Optimized route polyline */}
          {routePolyline.length > 1 && (
            <Polyline
              positions={routePolyline}
              pathOptions={{ color: '#2563eb', weight: 3, dashArray: '6 4' }}
            />
          )}

          {/* Numbered stop markers */}
          {route?.stopSequence.map((stop, i) => (
            <CircleMarker
              key={`stop-${i}`}
              center={[stop.lat, stop.lng]}
              radius={10}
              pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.9, weight: 2 }}
            >
              <Tooltip permanent direction="center" className="route-stop-label">
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'white' }}>{i + 1}</span>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
