import { prisma } from '../../lib/prisma'
import { getIO } from '../../lib/socket'
import type { UpdatePositionInput } from './trucks.schema'

const AVERAGE_SPEED_KMH = 30 // Average truck speed in urban Africa

/**
 * Calculate ETA to next stop in minutes.
 * Based on remaining route distance and average urban speed.
 */
function calculateEta(totalDistanceKm: number | null, completionPercent: number): number | null {
  if (totalDistanceKm === null || totalDistanceKm === 0) return null
  const remainingKm = totalDistanceKm * (1 - completionPercent / 100)
  return Math.round((remainingKm / AVERAGE_SPEED_KMH) * 60)
}

export class TrucksService {
  async getActiveTrucks(cityId: string) {
    const trucks = await prisma.truck.findMany({
      where: {
        isActive: true,
        company: { cityId },
      },
      select: {
        id: true,
        name: true,
        currentLat: true,
        currentLng: true,
        lastUpdated: true,
        completionPercent: true,
        activeRouteId: true,
        driver: {
          select: {
            user: { select: { name: true } },
          },
        },
      },
    })

    // Enrich each truck with ETA from its active route
    const trucksWithEta = await Promise.all(
      trucks.map(async (truck) => {
        let etaMinutes: number | null = null

        if (truck.activeRouteId) {
          const route = await prisma.collectionRoute.findUnique({
            where: { id: truck.activeRouteId },
            select: { totalDistanceKm: true },
          })
          etaMinutes = calculateEta(route?.totalDistanceKm ?? null, truck.completionPercent)
        }

        return { ...truck, etaMinutes }
      })
    )

    return trucksWithEta
  }

  async updatePosition(truckId: string, input: UpdatePositionInput) {
    const truck = await prisma.truck.findUnique({ where: { id: truckId } })
    if (!truck) throw { status: 404, message: 'Truck not found' }

    const updated = await prisma.truck.update({
      where: { id: truckId },
      data: {
        currentLat: input.latitude,
        currentLng: input.longitude,
        lastUpdated: new Date(),
        ...(input.completionPercent !== undefined && {
          completionPercent: input.completionPercent,
        }),
      },
    })

    // Broadcast updated position to all clients in the city room via WebSocket
    try {
      getIO().to(`city:${truck.companyId}`).emit('truck_position', {
        truckId: updated.id,
        lat: updated.currentLat,
        lng: updated.currentLng,
        completionPercent: updated.completionPercent,
        lastUpdated: updated.lastUpdated,
      })
    } catch (err) {
      // Socket not initialized — happens in test environment, safe to ignore
      console.warn('WebSocket broadcast skipped:', (err as Error).message)
    }

    return updated
  }
}

export const trucksService = new TrucksService()
