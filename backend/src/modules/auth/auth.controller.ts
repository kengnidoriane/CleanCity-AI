import type { Request, Response, NextFunction } from 'express'
import { registerSchema, loginSchema, emailLoginSchema } from './auth.schema'
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

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = loginSchema.safeParse(req.body)
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

      const result = await authService.login(parsed.data)
      res.status(200).json(result)
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ message: err.message })
        return
      }
      next(err)
    }
  }
  async loginCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = emailLoginSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
        })
        return
      }
      const result = await authService.loginWithEmail(parsed.data, 'COMPANY')
      res.status(200).json(result)
    } catch (err: any) {
      if (err.status) { res.status(err.status).json({ message: err.message }); return }
      next(err)
    }
  }

  async loginMunicipal(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = emailLoginSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
        })
        return
      }
      const result = await authService.loginWithEmail(parsed.data, 'MUNICIPAL')
      res.status(200).json(result)
    } catch (err: any) {
      if (err.status) { res.status(err.status).json({ message: err.message }); return }
      next(err)
    }
  }
}

export const authController = new AuthController()