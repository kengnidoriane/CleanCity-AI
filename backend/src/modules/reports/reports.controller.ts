import type { Request, Response, NextFunction } from 'express'
import { createReportSchema, updateStatusSchema } from './reports.schema'
import { reportsService } from './reports.service'

export class ReportsController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createReportSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        })
        return
      }

      const report = await reportsService.create(
        parsed.data,
        req.user!.userId,
        req.file
      )
      res.status(201).json(report)
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ message: err.message })
        return
      }
      next(err)
    }
  }

  async getAuditTrail(req: Request, res: Response, next: NextFunction) {
    try {
      const { cityId, status, companyId, page, limit } = req.query as Record<string, string>
      if (!cityId) {
        res.status(400).json({ message: 'cityId is required' })
        return
      }
      const result = await reportsService.getAuditTrail(cityId, {
        status,
        companyId,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      })
      res.status(200).json(result)
    } catch (err) { next(err) }
  }

  async exportAuditCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const { cityId, status, companyId } = req.query as Record<string, string>
      if (!cityId) {
        res.status(400).json({ message: 'cityId is required' })
        return
      }
      const csv = await reportsService.exportAuditCsv(cityId, { status, companyId })
      const filename = `audit-${cityId}-${new Date().toISOString().split('T')[0]}.csv`
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.status(200).send(csv)
    } catch (err) { next(err) }
  }

  async getByCity(req: Request, res: Response, next: NextFunction) {
    try {
      const { cityId, status, wasteType, severity } = req.query as Record<string, string>

      if (!cityId) {
        res.status(400).json({ message: 'cityId query parameter is required' })
        return
      }

      const reports = await reportsService.findByCity(cityId, { status, wasteType, severity })
      res.status(200).json(reports)
    } catch (err) {
      next(err)
    }
  }

  async getMine(req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await reportsService.findByUser(req.user!.userId)
      res.status(200).json(reports)
    } catch (err) {
      next(err)
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportsService.findById(
        req.params['id'] as string,
        req.user!.userId
      )
      res.status(200).json(report)
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ message: err.message })
        return
      }
      next(err)
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateStatusSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        })
        return
      }

      const report = await reportsService.updateStatus(
        req.params['id'] as string,
        parsed.data
      )
      res.status(200).json(report)
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ message: err.message })
        return
      }
      next(err)
    }
  }
}

export const reportsController = new ReportsController()
