import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'

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
      const { analyticsService } = await import('./analytics.service')
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
      const { municipalAnalyticsService } = await import('./analytics.service')
      const kpis = await municipalAnalyticsService.getCityKpis(cityId)
      res.status(200).json(kpis)
    } catch (err) { next(err) }
  }

  async getCompanyPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const cityId = req.query['cityId'] as string
      if (!cityId) { res.status(400).json({ message: 'cityId is required' }); return }
      const { municipalAnalyticsService } = await import('./analytics.service')
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
      const { hotspotService } = await import('./analytics.service')
      const hotspots = await hotspotService.getHotspots(cityId, period)
      res.status(200).json(hotspots)
    } catch (err) { next(err) }
  }
}

export const hotspotController = new HotspotController()
