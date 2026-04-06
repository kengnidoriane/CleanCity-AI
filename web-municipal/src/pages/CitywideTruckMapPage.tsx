import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getCityTrucks, getCompanyColor, type Truck } from '../api/trucks'
import {
  connectToCity,
  onTruckPosition,
  disconnectSocket,
  type TruckPositionUpdate,
} from '../services/socket'
import { useAuthStore } from '../store/authStore'

const DEFAULT_CENTER: [number, number] = [14.6928, -17.4467]

function makeTruckIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      color:white;font-size:16px;
      width:32px;height:32px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);
    ">🚛</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

/** Group trucks by companyId for the legend */
function buildCompanyIndex(trucks: Truck[]): Map<string, { name: string; color: string; count: number }> {
  const map = new Map<string, { name: string; color: string; count: number }>()
  for (const truck of trucks) {
    const color = getCompanyColor(truck.companyId)
    const existing = map.get(truck.companyId)
    if (existing) {
      existing.count++
    } else {
      map.set(truck.companyId, { name: truck.companyName, color, count: 1 })
    }
  }
  return map
}

export default function CitywideTruckMapPage() {
  const user = useAuthStore((s) => s.user)
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handlePositionUpdate = useCallback((update: TruckPositionUpdate) => {
    setTrucks((prev) =>
      prev.map((t) =>
        t.id === update.truckId
          ? { ...t, currentLat: update.lat, currentLng: update.lng, completionPercent: update.completionPercent }
          : t
      )
    )
  }, [])

  useEffect(() => {
    if (!user?.cityId) return

    const fetchTrucks = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getCityTrucks(user.cityId)
        setTrucks(data)
      } catch {
        setError('Failed to load truck positions.')
      } finally {
        setIsLoading(false)
      }
    }

    void fetchTrucks()

    const socket = connectToCity(user.cityId)
    const unsubPosition = onTruckPosition(socket, handlePositionUpdate)

    return () => {
      unsubPosition()
      disconnectSocket(user.cityId)
    }
  }, [user?.cityId, handlePositionUpdate])

  const trucksWithCoords = trucks.filter((t) => t.currentLat !== null && t.currentLng !== null)
  const companyIndex = buildCompanyIndex(trucks)

  return (
    <div className="flex h-full" data-testid="citywide-truck-map-page">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">City Truck Map</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {isLoading ? 'Loading...' : `${trucksWithCoords.length} active trucks`}
          </p>
        </div>

        {/* Company legend */}
        <div className="px-4 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Companies
          </p>
          {companyIndex.size === 0 && !isLoading && (
            <p className="text-xs text-gray-400">No active companies</p>
          )}
          <div className="space-y-2" data-testid="company-legend">
            {Array.from(companyIndex.entries()).map(([id, { name, color, count }]) => (
              <div key={id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-gray-700 truncate max-w-[120px]">{name}</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">{count} 🚛</span>
              </div>
            ))}
          </div>
        </div>

        {/* Truck list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {!isLoading && trucks.length === 0 && !error && (
            <p className="text-xs text-gray-400 text-center py-6">No active trucks in the city</p>
          )}

          {trucks.map((truck) => {
            const color = getCompanyColor(truck.companyId)
            return (
              <div
                key={truck.id}
                className="p-2.5 rounded-lg border border-gray-100 bg-gray-50 text-xs"
                data-testid={`truck-card-${truck.id}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-semibold text-gray-800 truncate">{truck.name}</span>
                </div>
                <p className="text-gray-400 truncate">{truck.companyName}</p>
                {truck.driver && (
                  <p className="text-gray-500 mt-0.5">👤 {truck.driver.user.name}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${truck.completionPercent}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-gray-500 shrink-0">{truck.completionPercent}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative" data-testid="map-container">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
            <p className="text-sm text-gray-500">Loading trucks...</p>
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
          {trucksWithCoords.map((truck) => (
            <Marker
              key={truck.id}
              position={[truck.currentLat!, truck.currentLng!]}
              icon={makeTruckIcon(getCompanyColor(truck.companyId))}
            >
              <Popup>
                <div className="text-sm min-w-[160px]">
                  <p className="font-semibold text-gray-900">{truck.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{truck.companyName}</p>
                  {truck.driver && (
                    <p className="text-xs text-gray-500">👤 {truck.driver.user.name}</p>
                  )}
                  <p className="text-xs mt-1">{truck.completionPercent}% complete</p>
                  {truck.etaMinutes !== null && (
                    <p className="text-blue-600 text-xs">⏱ ETA: {truck.etaMinutes} min</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
