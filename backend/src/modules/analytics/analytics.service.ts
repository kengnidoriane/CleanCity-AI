import { prisma } from '../../lib/prisma'

type Period = 'day' | 'week' | 'month'

function getPeriodRange(period: Period): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  if (period === 'day') start.setDate(start.getDate() - 1)
  else if (period === 'week') start.setDate(start.getDate() - 7)
  else start.setMonth(start.getMonth() - 1)
  return { start, end }
}

function getPreviousPeriodRange(period: Period): { start: Date; end: Date } {
  const current = getPeriodRange(period)
  const duration = current.end.getTime() - current.start.getTime()
  return {
    start: new Date(current.start.getTime() - duration),
    end: new Date(current.start.getTime()),
  }
}

async function computeStats(companyId: string, start: Date, end: Date) {
  const [reports, routes] = await Promise.all([
    prisma.wasteReport.findMany({
      where: { companyId, createdAt: { gte: start, lte: end } },
      select: { status: true },
    }),
    prisma.collectionRoute.findMany({
      where: { companyId, createdAt: { gte: start, lte: end } },
      select: { totalDistanceKm: true },
    }),
  ])
  const totalReports = reports.length
  const collected = reports.filter(r => r.status === 'COLLECTED').length
  const pending = totalReports - collected
  const collectionRate = totalReports > 0 ? Math.round((collected / totalReports) * 100) : 0
  const totalDistanceKm = routes.reduce((sum, r) => sum + (r.totalDistanceKm ?? 0), 0)
  return { totalReports, collected, pending, collectionRate, totalDistanceKm }
}

export class AnalyticsService {
  async getCompanyStats(companyId: string, period: Period) {
    const current = getPeriodRange(period)
    const previous = getPreviousPeriodRange(period)
    const [currentStats, previousStats] = await Promise.all([
      computeStats(companyId, current.start, current.end),
      computeStats(companyId, previous.start, previous.end),
    ])
    return { period, current: currentStats, previous: previousStats }
  }
}

export const analyticsService = new AnalyticsService()

export class MunicipalAnalyticsService {
  async getCityKpis(cityId: string) {
    const [totalActiveReports, collectedReports, activeTrucks, routes] = await Promise.all([
      prisma.wasteReport.count({ where: { cityId, status: { not: 'COLLECTED' } } }),
      prisma.wasteReport.count({ where: { cityId, status: 'COLLECTED' } }),
      prisma.truck.count({ where: { isActive: true, company: { cityId } } }),
      prisma.collectionRoute.findMany({
        where: { company: { cityId }, status: 'COMPLETED' },
        select: { estimatedDurationMin: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ])
    const total = totalActiveReports + collectedReports
    const collectionRate = total > 0 ? Math.round((collectedReports / total) * 100) : 0
    const avgResponseTimeMin = routes.length > 0
      ? Math.round(routes.reduce((s, r) => s + (r.estimatedDurationMin ?? 0), 0) / routes.length)
      : 0
    return { totalActiveReports, collectionRate, activeTrucks, avgResponseTimeMin }
  }

  async getCompanyPerformance(cityId: string) {
    const companies = await prisma.company.findMany({
      where: { cityId },
      select: { id: true, name: true, trucks: { where: { isActive: true }, select: { id: true } } },
    })
    const results = await Promise.all(companies.map(async (company) => {
      const reports = await prisma.wasteReport.findMany({
        where: { companyId: company.id },
        select: { status: true, createdAt: true, collectedAt: true },
      })
      const totalReports = reports.length
      const collected = reports.filter(r => r.status === 'COLLECTED').length
      const collectionRate = totalReports > 0 ? Math.round((collected / totalReports) * 100) : 0
      const responseTimes = reports.filter(r => r.collectedAt)
        .map(r => (r.collectedAt!.getTime() - r.createdAt.getTime()) / 60000)
      const avgResponseTimeMin = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length) : 0
      return { id: company.id, name: company.name, totalReports, collected, collectionRate, activeTrucks: company.trucks.length, avgResponseTimeMin }
    }))
    return results.sort((a, b) => b.collectionRate - a.collectionRate)
  }
}

export const municipalAnalyticsService = new MunicipalAnalyticsService()

const GRID_SIZE_DEG = 0.01

export class HotspotService {
  async getHotspots(cityId: string, periodDays?: number) {
    const where: Record<string, unknown> = { cityId }
    if (periodDays) {
      const since = new Date()
      since.setDate(since.getDate() - periodDays)
      where['createdAt'] = { gte: since }
    }
    const reports = await prisma.wasteReport.findMany({ where, select: { latitude: true, longitude: true } })
    if (reports.length === 0) return []
    const grid = new Map<string, { lat: number; lng: number; count: number }>()
    for (const r of reports) {
      const cellLat = Math.round(r.latitude / GRID_SIZE_DEG) * GRID_SIZE_DEG
      const cellLng = Math.round(r.longitude / GRID_SIZE_DEG) * GRID_SIZE_DEG
      const key = `${cellLat},${cellLng}`
      const existing = grid.get(key)
      if (existing) existing.count++
      else grid.set(key, { lat: cellLat, lng: cellLng, count: 1 })
    }
    const cells = Array.from(grid.values())
    const maxCount = Math.max(...cells.map(c => c.count))
    return cells.map(c => ({ lat: c.lat, lng: c.lng, count: c.count, intensity: maxCount > 0 ? Math.round((c.count / maxCount) * 100) / 100 : 0 }))
      .sort((a, b) => b.count - a.count)
  }
}

export const hotspotService = new HotspotService()

export class MonthlyReportService {
  async generateReport(cityId: string, year: number, month: number): Promise<Buffer> {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59)
    const [reports, companies] = await Promise.all([
      prisma.wasteReport.findMany({ where: { cityId, createdAt: { gte: start, lte: end } }, select: { status: true, latitude: true, longitude: true, companyId: true } }),
      prisma.company.findMany({ where: { cityId }, select: { id: true, name: true } }),
    ])
    const totalReports = reports.length
    const totalCollected = reports.filter(r => r.status === 'COLLECTED').length
    const collectionRate = totalReports > 0 ? Math.round((totalCollected / totalReports) * 100) : 0
    const grid = new Map<string, number>()
    for (const r of reports) {
      const key = `${Math.round(r.latitude / GRID_SIZE_DEG) * GRID_SIZE_DEG},${Math.round(r.longitude / GRID_SIZE_DEG) * GRID_SIZE_DEG}`
      grid.set(key, (grid.get(key) ?? 0) + 1)
    }
    const topZones = Array.from(grid.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([zone, count]) => ({ zone, count }))
    const companyStats = companies.map(c => {
      const cr = reports.filter(r => r.companyId === c.id)
      const col = cr.filter(r => r.status === 'COLLECTED').length
      return { name: c.name, total: cr.length, collected: col, rate: cr.length > 0 ? Math.round((col / cr.length) * 100) : 0 }
    })
    const PDFDocument = (await import('pdfkit')).default
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', resolve)
      doc.on('error', reject)
      const monthName = start.toLocaleString('en-US', { month: 'long' })
      doc.fontSize(20).text(`Monthly Report — ${monthName} ${year}`, { align: 'center' }).moveDown()
      doc.fontSize(14).text('Summary')
      doc.fontSize(11).text(`Total reports: ${totalReports}`).text(`Total collected: ${totalCollected}`).text(`Collection rate: ${collectionRate}%`).moveDown()
      doc.fontSize(14).text('Top 5 Problem Zones')
      doc.fontSize(11)
      topZones.forEach((z, i) => doc.text(`${i + 1}. ${z.zone} — ${z.count} reports`))
      doc.moveDown().fontSize(14).text('Performance by Company').fontSize(11)
      companyStats.forEach(c => doc.text(`${c.name}: ${c.collected}/${c.total} (${c.rate}%)`))
      doc.end()
    })
    return Buffer.concat(chunks)
  }
}

export const monthlyReportService = new MonthlyReportService()
