import { prisma } from '../../lib/prisma'
import { callOptimizeRoute } from '../../lib/ai-client'
import type { OptimizeRouteInput, AssignRouteInput } from './routes.schema'

export class RoutesService {
  async optimize(input: OptimizeRouteInput, companyId: string) {
    // 1. Call AI service to get optimized stop order
    const result = await callOptimizeRoute(input.stops)

    // 2. Save the route as DRAFT in database
    const route = await prisma.collectionRoute.create({
      data: {
        companyId,
        stopSequence: result.orderedStops,
        totalDistanceKm: result.totalDistanceKm,
        estimatedDurationMin: result.estimatedDurationMin,
        status: 'DRAFT',
      },
    })

    return route
  }

  async assign(routeId: string, input: AssignRouteInput, companyId: string) {
    // 1. Verify route exists
    const route = await prisma.collectionRoute.findUnique({ where: { id: routeId } })
    if (!route) throw { status: 404, message: 'Route not found' }

    // 2. Verify truck belongs to this company
    const truck = await prisma.truck.findUnique({ where: { id: input.truckId } })
    if (!truck) throw { status: 404, message: 'Truck not found' }
    if (truck.companyId !== companyId) throw { status: 403, message: 'Truck does not belong to your company' }

    // 3. Extract all report IDs from the stop sequence
    const stops = route.stopSequence as Array<{ reportId: string; reportIds: string[] }>
    const allReportIds = stops.flatMap(s => s.reportIds ?? [s.reportId])

    // 4. Execute all updates atomically — if one fails, all are rolled back
    const updated = await prisma.$transaction(async (tx) => {
      const updatedRoute = await tx.collectionRoute.update({
        where: { id: routeId },
        data: { truckId: input.truckId, status: 'ACTIVE' },
      })

      await tx.truck.update({
        where: { id: input.truckId },
        data: { activeRouteId: routeId, isActive: true, completionPercent: 0 },
      })

      await tx.wasteReport.updateMany({
        where: { id: { in: allReportIds } },
        data: { status: 'ASSIGNED', companyId },
      })

      return updatedRoute
    })

    return updated
  }

  async findById(routeId: string) {
    const route = await prisma.collectionRoute.findUnique({ where: { id: routeId } })
    if (!route) throw { status: 404, message: 'Route not found' }
    return route
  }
}

export const routesService = new RoutesService()
