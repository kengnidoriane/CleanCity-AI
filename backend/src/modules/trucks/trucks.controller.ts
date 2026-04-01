import type { Request, Response, NextFunction } from 'express'
import { updatePositionSchema } from './trucks.schema'
import { trucksService } from './trucks.service'

export class TrucksController {
  async getActive(req: Request, res: Response, next: NextFunction) {
    try {
      const { cityId } = req.query as { cityId?: string }
      if (!cityId) {
        res.status(400).json({ message: 'cityId query parameter is required' })
        return
      }

      const trucks = await trucksService.getActiveTrucks(cityId)
      res.status(200).json(trucks)
    } catch (err) {
      next(err)
    }
  }

  async updatePosition(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updatePositionSchema.safeParse(req.body)
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

      const truck = await trucksService.updatePosition(
        req.params['id'] as string,
        parsed.data
      )
      res.status(200).json(truck)
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ message: err.message })
        return
      }
      next(err)
    }
  }
}

export const trucksController = new TrucksController()
