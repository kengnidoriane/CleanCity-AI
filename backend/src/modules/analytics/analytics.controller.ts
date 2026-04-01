import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import {
  analyticsService,
  municipalAnalyticsService,
  hotspotService,
  monthlyReportService,
} from './analytics.service'

const companyStatsSchema = z.object({
  companyId: z.string().min(1, 'companyId is required'),
  period: z.enum(['day', 'week', 'month'], { error: 'period must be day, week or month' }),
})

export class AnalyticsController {
  async getCompanyStats(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = companyStatsSchema.safeParse(req.query)
      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
        })
        return
      }
      const stats = await analyticsService.getCompanyStats(parsed.data.companyId, parsed.data.period)
      res.status(200).json(stats)
    } catch (err) { next(err) }
  }
}

export const analyticsController = new AnalyticsController()

export class MunicipalAnalyticsController {
  async getCityKpis(req: Request, res: Response, next: NextFunction) {
    try {
      const cityId = req.query['cityId'] as string
      if (!cityId) { res.status(400).json({ message: 'cityId is required' }); return }
      const kpis = await municipalAnalyticsService.getCityKpis(cityId)
      res.status(200).json(kpis)
    } catch (err) { next(err) }
  }

  async getCompanyPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const cityId = req.query['cityId'] as string
      if (!cityId) { res.status(400).json({ message: 'cityId is required' }); return }
      const data = await municipalAnalyticsService.getCompanyPerformance(cityId)
      res.status(200).json(data)
    } catch (err) { next(err) }
  }
}

export const municipalAnalyticsController = new MunicipalAnalyticsController()

export class HotspotController {
  async getHotspots(req: Request, res: Response, next: NextFunction) {
    try {
      const cityId = req.query['cityId'] as string
      if (!cityId) { res.status(400).json({ message: 'cityId is required' }); return }
      const period = req.query['period'] ? parseInt(req.query['period'] as string) : undefined
      const hotspots = await hotspotService.getHotspots(cityId, period)
      res.status(200).json(hotspots)
    } catch (err) { next(err) }
  }
}

export const hotspotController = new HotspotController()

export class MonthlyReportController {
  async generateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { cityId, year, month } = req.query as Record<string, string>
      if (!cityId) { res.status(400).json({ message: 'cityId is required' }); return }
      if (!year || !month) { res.status(400).json({ message: 'year and month are required' }); return }

      const pdfBuffer = await monthlyReportService.generateReport(cityId, parseInt(year), parseInt(month))

      const filename = `monthly-report-${year}-${month.padStart(2, '0')}.pdf`
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.status(200).send(pdfBuffer)
    } catch (err) { next(err) }
  }
}

export const monthlyReportController = new MonthlyReportController()
