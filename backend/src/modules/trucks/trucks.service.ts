import { prisma } from '../../lib/prisma'
import { getIO } from '../../lib/socket'
import type { UpdatePositionInput } from './trucks.schema'

export class TrucksService {
  async getActiveTrucks(cityId: string) {
    return prisma.truck.findMany({
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
