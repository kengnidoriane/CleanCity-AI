import { prisma } from '../../lib/prisma'
import { callOptimizeRoute } from '../../lib/ai-client'
import { sendPushNotification } from '../../lib/notifications'
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

  async completeStop(routeId: string, stopIndex: number) {
    const route = await prisma.collectionRoute.findUnique({ where: { id: routeId } })
    if (!route) throw { status: 404, message: 'Route not found' }

    const stops = route.stopSequence as Array<{
      reportId: string
      reportIds: string[]
      lat: number
      lng: number
      severity: string
      collected: boolean
    }>

    if (stopIndex < 0 || stopIndex >= stops.length) {
      throw { status: 400, message: `Stop index ${stopIndex} is out of range (0-${stops.length - 1})` }
    }

    // Mark the stop as collected
    stops[stopIndex]!.collected = true

    // Calculate new completion percentage
    const collectedCount = stops.filter(s => s.collected).length
    const completionPercent = Math.round((collectedCount / stops.length) * 100)
    const allCollected = collectedCount === stops.length

    // Update the report status to COLLECTED and notify citizen
    const reportIds = stops[stopIndex]!.reportIds ?? [stops[stopIndex]!.reportId]
    const report = await prisma.wasteReport.update({
      where: { id: reportIds[0] },
      data: { status: 'COLLECTED', collectedAt: new Date() },
    })

    // Fire and forget push notification — must not block the response
    prisma.user.findUnique({
      where: { id: report.userId },
      select: { pushToken: true },
    }).then(citizen => {
      if (citizen?.pushToken) {
        const date = report.createdAt.toLocaleDateString('en-GB')
        sendPushNotification(
          citizen.pushToken,
          `Your waste report from ${date} has been collected. Thank you!`
        ).catch(err => console.error('Push notification failed:', err))
      }
    }).catch(() => { /* non-blocking */ })

    // Update route with new stop sequence and completion
    const updated = await prisma.collectionRoute.update({
      where: { id: routeId },
      data: {
        stopSequence: stops,
        ...(allCollected && { status: 'COMPLETED' }),
      },
    })

    // Update truck completion percent
    if (route.truckId) {
      await prisma.truck.update({
        where: { id: route.truckId },
        data: {
          completionPercent,
          ...(allCollected && { isActive: false, activeRouteId: null }),
        },
      })
    }

    return { ...updated, completionPercent }
  }

  async findById(routeId: string) {
    const route = await prisma.collectionRoute.findUnique({ where: { id: routeId } })
    if (!route) throw { status: 404, message: 'Route not found' }
    return route
  }
}

export const routesService = new RoutesService()
