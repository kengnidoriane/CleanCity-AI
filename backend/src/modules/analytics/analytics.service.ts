import { prisma } from '../../lib/prisma'

type Period = 'day' | 'week' | 'month'

/**
 * Get the start and end dates for a given period relative to now.
 */
function getPeriodDates(period: Period): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const now = new Date()
  const end = new Date(now)
  const start = new Date(now)
  const prevEnd = new Date(now)
  const prevStart = new Date(now)

  const daysMap: Record<Period, number> = { day: 1, week: 7, month: 30 }
  const days = daysMap[period]

  start.setDate(start.getDate() - days)
  prevEnd.setDate(prevEnd.getDate() - days)
  prevStart.setDate(prevStart.getDate() - days * 2)

  return { start, end, prevStart, prevEnd }
}

async function getStats(companyId: string, from: Date, to: Date) {
  const [total, collected, pending, routeAgg] = await Promise.all([
    prisma.wasteReport.count({
      where: { companyId, createdAt: { gte: from, lte: to } },
    }),
    prisma.wasteReport.count({
      where: { companyId, status: 'COLLECTED', createdAt: { gte: from, lte: to } },
    }),
    prisma.wasteReport.count({
      where: { companyId, status: 'PENDING', createdAt: { gte: from, lte: to } },
    }),
    prisma.collectionRoute.aggregate({
      where: { companyId, createdAt: { gte: from, lte: to } },
      _sum: { totalDistanceKm: true },
    }),
  ])

  const collectionRate = total > 0 ? Math.round((collected / total) * 100) : 0
  const totalDistanceKm = routeAgg._sum.totalDistanceKm ?? 0

  return { totalReports: total, collected, pending, collectionRate, totalDistanceKm }
}

export class AnalyticsService {
  async getCompanyStats(companyId: string, period: Period) {
    const { start, end, prevStart, prevEnd } = getPeriodDates(period)

    const [current, previous] = await Promise.all([
      getStats(companyId, start, end),
      getStats(companyId, prevStart, prevEnd),
    ])

    return { period, current, previous }
  }
}

export const analyticsService = new AnalyticsService()

export class MunicipalAnalyticsService {
  async getCityKpis(cityId: string) {
    const [totalActive, collected, activeTrucks, routeAgg] = await Promise.all([
      prisma.wasteReport.count({
        where: { cityId },
      }),
      prisma.wasteReport.count({
        where: { cityId, status: 'COLLECTED' },
      }),
      prisma.truck.count({
        where: { isActive: true, company: { cityId } },
      }),
      prisma.collectionRoute.aggregate({
        where: { company: { cityId } },
        _avg: { estimatedDurationMin: true },
      }),
    ])

    const collectionRate = totalActive > 0 ? Math.round((collected / totalActive) * 100) : 0
    const avgResponseTimeMin = Math.round(routeAgg._avg.estimatedDurationMin ?? 0)

    return {
      totalActiveReports: totalActive,
      collectionRate,
      activeTrucks,
      avgResponseTimeMin,
    }
  }

  async getCompanyPerformance(cityId: string) {
    const companies = await prisma.company.findMany({
      where: { cityId },
    })

    const results = await Promise.all(
      companies.map(async (company) => {
        const [total, collected, activeTrucks, routeAgg] = await Promise.all([
          prisma.wasteReport.count({ where: { companyId: company.id } }),
          prisma.wasteReport.count({ where: { companyId: company.id, status: 'COLLECTED' } }),
          prisma.truck.count({ where: { companyId: company.id, isActive: true } }),
          prisma.collectionRoute.aggregate({
            where: { companyId: company.id },
            _avg: { estimatedDurationMin: true },
          }),
        ])

        const collectionRate = total > 0 ? Math.round((collected / total) * 100) : 0

        return {
          id: company.id,
          name: company.name,
          totalReports: total,
          collected,
          collectionRate,
          activeTrucks,
          avgResponseTimeMin: Math.round(routeAgg._avg.estimatedDurationMin ?? 0),
        }
      })
    )

    return results.sort((a, b) => b.collectionRate - a.collectionRate)
  }
}

export const municipalAnalyticsService = new MunicipalAnalyticsService()
