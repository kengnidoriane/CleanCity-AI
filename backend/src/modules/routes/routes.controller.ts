import type { Request, Response, NextFunction } from 'express'
import { optimizeRouteSchema, assignRouteSchema } from './routes.schema'
import { routesService } from './routes.service'

export class RoutesController {
  async optimize(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = optimizeRouteSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
        })
        return
      }

      const route = await routesService.optimize(parsed.data, req.user!.userId)
      res.status(201).json(route)
    } catch (err: any) {
      if (err.status) { res.status(err.status).json({ message: err.message }); return }
      next(err)
    }
  }

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = assignRouteSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
        })
        return
      }

      const route = await routesService.assign(
        req.params['id'] as string,
        parsed.data,
        req.user!.userId
      )
      res.status(200).json(route)
    } catch (err: any) {
      if (err.status) { res.status(err.status).json({ message: err.message }); return }
      next(err)
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const route = await routesService.findById(req.params['id'] as string)
      res.status(200).json(route)
    } catch (err: any) {
      if (err.status) { res.status(err.status).json({ message: err.message }); return }
      next(err)
    }
  }
}

export const routesController = new RoutesController()
