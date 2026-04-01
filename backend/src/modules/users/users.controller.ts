import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import Expo from 'expo-server-sdk'

const pushTokenSchema = z.object({
  pushToken: z.string().min(1, 'Push token is required'),
})

export class UsersController {
  async registerPushToken(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = pushTokenSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ message: 'Invalid push token' })
        return
      }

      if (!Expo.isExpoPushToken(parsed.data.pushToken)) {
        res.status(400).json({ message: 'Invalid Expo push token format' })
        return
      }

      await prisma.user.update({
        where: { id: req.user!.userId },
        data: { pushToken: parsed.data.pushToken },
      })

      res.status(200).json({ message: 'Push token registered successfully' })
    } catch (err) {
      next(err)
    }
  }
}

export const usersController = new UsersController()
