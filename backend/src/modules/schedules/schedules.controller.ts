import type { Request, Response, NextFunction } from 'express'
import { createScheduleSchema } from './schedules.schema'
import { schedulesService } from './schedules.service'

export class SchedulesController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createScheduleSchema.safeParse(req.body)
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

      const schedule = await schedulesService.create(parsed.data, req.user!.userId)
      res.status(201).json(schedule)
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ message: err.message })
        return
      }
      next(err)
    }
  }

  async getByZone(req: Request, res: Response, next: NextFunction) {
    try {
      const { zone, cityId } = req.query as { zone?: string; cityId?: string }

      if (!cityId) {
        res.status(400).json({ message: 'cityId query parameter is required' })
        return
      }

      const schedules = zone
        ? await schedulesService.findByZone(zone, cityId)
        : await schedulesService.findByCity(cityId)

      res.status(200).json(schedules)
    } catch (err) {
      next(err)
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await schedulesService.delete(req.params['id'] as string, req.user!.userId)
      res.status(204).send()
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ message: err.message })
        return
      }
      next(err)
    }
  }
}

export const schedulesController = new SchedulesController()
