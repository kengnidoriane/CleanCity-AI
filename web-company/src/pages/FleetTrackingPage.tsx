import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getActiveTrucks, type Truck } from '../api/trucks'
import {
  connectToCity,
  onTruckPosition,
  onTruckAlert,
  disconnectSocket,
  type TruckPositionUpdate,
  type TruckAlert,
} from '../services/socket'
import { useAuthStore } from '../store/authStore'

const DEFAULT_CENTER: [number, number] = [14.6928, -17.4467]
const MAX_ALERTS = 20

// Custom truck icon
function makeTruckIcon(hasAlert: boolean) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${hasAlert ? '#dc2626' : '#2563eb'};
      color:white;font-size:18px;
      width:32px;height:32px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);
    ">🚛</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

export default function FleetTrackingPage() {
  const user = useAuthStore((s) => s.user)
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [alerts, setAlerts] = useState<TruckAlert[]>([])
  const [alertTruckIds, setAlertTruckIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  const handlePositionUpdate = useCallback((update: TruckPositionUpdate) => {
    setTrucks((prev) =>
      prev.map((t) =>
        t.id === update.truckId
          ? { ...t, currentLat: update.lat, currentLng: update.lng, completionPercent: update.completionPercent }
          : t
      )
    )
  }, [])

  const handleAlert = useCallback((alert: TruckAlert) => {
    setAlerts((prev) => [alert, ...prev].slice(0, MAX_ALERTS))
    setAlertTruckIds((prev) => new Set([...prev, alert.truckId]))
  }, [])

  useEffect(() => {
    if (!user?.cityId) return

    getActiveTrucks(user.cityId)
      .then((data) => setTrucks(data))
      .finally(() => setIsLoading(false))

    const socket = connectToCity(user.cityId)
    const unsubPosition = onTruckPosition(socket, handlePositionUpdate)
    const unsubAlert = onTruckAlert(socket, handleAlert)

    return () => {
      unsubPosition()
      unsubAlert()
      disconnectSocket(user.cityId)
    }
  }, [user?.cityId, handlePositionUpdate, handleAlert])

  const trucksWithCoords = trucks.filter((t) => t.currentLat !== null && t.currentLng !== null)

  return (
    <div className="flex h-full" data-testid="fleet-tracking-page">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Fleet Tracking</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {isLoading ? 'Loading...' : `${trucksWithCoords.length} active trucks`}
          </p>
        </div>

        {/* Truck list */}
        <div className="px-3 py-3 space-y-2 border-b border-gray-100">
          {trucks.map((truck) => {
            const hasAlert = alertTruckIds.has(truck.id)
            return (
              <div
                key={truck.id}
                className={`p-2.5 rounded-lg border text-xs ${
                  hasAlert ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'
                }`}
                data-testid={`truck-card-${truck.id}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800">{truck.name}</span>
                  {hasAlert && <span className="text-red-500 text-[10px] font-bold">⚠ ALERT</span>}
                </div>
                {truck.driver && (
                  <p className="text-gray-500">👤 {truck.driver.user.name}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{ width: `${truck.completionPercent}%` }}
                    />
                  </div>
                  <span className="text-gray-500 shrink-0">{truck.completionPercent}%</span>
                </div>
                {truck.etaMinutes !== null && (
                  <p className="text-green-600 mt-1">⏱ ETA: {truck.etaMinutes} min</p>
                )}
              </div>
            )
          })}
          {!isLoading && trucks.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">No active trucks</p>
          )}
        </div>

        {/* Alerts panel */}
        <div className="px-3 py-3 flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Alerts</p>
            {alerts.length > 0 && (
              <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">
                {alerts.length}
              </span>
            )}
          </div>
          {alerts.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No alerts</p>
          ) : (
            <div className="space-y-2" data-testid="alerts-panel">
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className="p-2 bg-red-50 border border-red-200 rounded-lg"
                  data-testid={`alert-${alert.type.toLowerCase()}`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-red-500 text-[10px] font-bold">
                      {alert.type === 'DEVIATION' ? '📍 DEVIATION' : '⏸ IDLE'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{alert.message}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(alert.detectedAt).toLocaleTimeString()}
                  </p>
                </div>
              ))}
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
          {trucksWithCoords.map((truck) => (
            <Marker
              key={truck.id}
              position={[truck.currentLat!, truck.currentLng!]}
              icon={makeTruckIcon(alertTruckIds.has(truck.id))}
            >
              <Popup>
                <div className="text-sm min-w-[140px]">
                  <p className="font-semibold">{truck.name}</p>
                  {truck.driver && <p className="text-gray-500 text-xs">👤 {truck.driver.user.name}</p>}
                  <p className="text-xs mt-1">{truck.completionPercent}% complete</p>
                  {truck.etaMinutes !== null && (
                    <p className="text-green-600 text-xs">⏱ ETA: {truck.etaMinutes} min</p>
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
