import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { analyticsService } from './analytics.service'

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

      const stats = await analyticsService.getCompanyStats(
        parsed.data.companyId,
        parsed.data.period
      )
      res.status(200).json(stats)
    } catch (err) {
      next(err)
    }
  }
}

export const analyticsController = new AnalyticsController()
