import { prisma } from '../lib/prisma'
import { isDeviated, isIdle, broadcastAlert } from '../lib/alerts'

const CHECK_INTERVAL_MS = 30 * 1000 // Check every 30 seconds

/**
 * Monitor active trucks for deviation and idle alerts.
 * Runs as a background job every 30 seconds.
 */
export async function checkTruckAlerts(): Promise<void> {
  const activeTrucks = await prisma.truck.findMany({
    where: { isActive: true },
    select: {
      id: true,
      companyId: true,
      currentLat: true,
      currentLng: true,
      lastUpdated: true,
      activeRouteId: true,
    },
  })

  for (const truck of activeTrucks) {
    // Check idle alert
    if (isIdle(truck.lastUpdated)) {
      broadcastAlert(truck.companyId, {
        truckId: truck.id,
        type: 'IDLE',
        message: `Truck has been idle for more than 15 minutes`,
        detectedAt: new Date(),
      })
    }

    // Check deviation alert
    if (truck.activeRouteId && truck.currentLat && truck.currentLng) {
      const route = await prisma.collectionRoute.findUnique({
        where: { id: truck.activeRouteId },
        select: { stopSequence: true },
      })

      if (route) {
        const stops = route.stopSequence as Array<{ lat: number; lng: number }>
        if (isDeviated(truck.currentLat, truck.currentLng, stops)) {
          broadcastAlert(truck.companyId, {
            truckId: truck.id,
            type: 'DEVIATION',
            message: `Truck has deviated more than 500m from its assigned route`,
            detectedAt: new Date(),
          })
        }
      }
    }
  }
}

export function startAlertMonitor(): NodeJS.Timeout {
  return setInterval(async () => {
    try {
      await checkTruckAlerts()
    } catch (err) {
      console.error('[AlertMonitor] Error checking truck alerts:', err)
    }
  }, CHECK_INTERVAL_MS)
}
