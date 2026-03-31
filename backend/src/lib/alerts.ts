import { getIO } from './socket'

export type AlertType = 'DEVIATION' | 'IDLE'

export interface TruckAlert {
  truckId: string
  type: AlertType
  message: string
  detectedAt: Date
}

const DEVIATION_THRESHOLD_KM = 0.5  // 500 meters
const IDLE_THRESHOLD_MS = 15 * 60 * 1000  // 15 minutes in milliseconds

/**
 * Calculate great-circle distance between two GPS points using Haversine formula.
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

/**
 * Check if a truck has deviated more than 500m from any stop in its route.
 */
export function isDeviated(
  truckLat: number,
  truckLng: number,
  routeStops: Array<{ lat: number; lng: number }>
): boolean {
  if (routeStops.length === 0) return false
  const minDistance = Math.min(
    ...routeStops.map(stop => haversineKm(truckLat, truckLng, stop.lat, stop.lng))
  )
  return minDistance > DEVIATION_THRESHOLD_KM
}

/**
 * Check if a truck has been idle for more than 15 minutes.
 */
export function isIdle(lastUpdated: Date | null): boolean {
  if (!lastUpdated) return false
  return Date.now() - lastUpdated.getTime() > IDLE_THRESHOLD_MS
}

/**
 * Broadcast a truck alert to the company room via WebSocket.
 */
export function broadcastAlert(companyId: string, alert: TruckAlert): void {
  try {
    getIO().to(`city:${companyId}`).emit('truck_alert', alert)
  } catch {
    // Socket not initialized in test environment
  }
}
