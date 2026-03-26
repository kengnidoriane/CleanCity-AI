import { Router, type IRouter } from 'express'
import { authenticate } from '../../middlewares/authenticate'
import { usersController } from './users.controller'

export const usersRouter: IRouter = Router()

/**
 * @swagger
 * /api/users/push-token:
 *   post:
 *     summary: Register Expo push token for the authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pushToken]
 *             properties:
 *               pushToken:
 *                 type: string
 *                 example: "ExponentPushToken[xxxxxx]"
 *     responses:
 *       200:
 *         description: Push token registered successfully
 *       400:
 *         description: Invalid push token
 *       401:
 *         description: Unauthorized
 */
usersRouter.post(
  '/push-token',
  authenticate,
  (req, res, next) => usersController.registerPushToken(req, res, next)
)
