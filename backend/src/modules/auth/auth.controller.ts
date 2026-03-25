import type { Request, Response, NextFunction } from 'express'
import { registerSchema } from './auth.schema'
import { authService } from './auth.service'

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input with Zod
      const parsed = registerSchema.safeParse(req.body)
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

      const result = await authService.register(parsed.data)
      res.status(201).json(result)
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ message: err.message })
        return
      }
      next(err)
    }
  }
}

export const authController = new AuthController()
