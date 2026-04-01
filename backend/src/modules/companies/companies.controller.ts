import type { Request, Response, NextFunction } from 'express'
import { registerCompanySchema } from './companies.schema'
import { companiesService } from './companies.service'

export class CompaniesController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = registerCompanySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
        })
        return
      }

      const result = await companiesService.register(parsed.data)
      res.status(201).json(result)
    } catch (err: any) {
      if (err.status) { res.status(err.status).json({ message: err.message }); return }
      next(err)
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const cityId = req.query['cityId'] as string
      if (!cityId) {
        res.status(400).json({ message: 'cityId is required' })
        return
      }
      const companies = await companiesService.findByCity(cityId)
      res.status(200).json(companies)
    } catch (err) { next(err) }
  }
}

export const companiesController = new CompaniesController()
