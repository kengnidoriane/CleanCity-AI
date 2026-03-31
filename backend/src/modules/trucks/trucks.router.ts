import { Router, type IRouter } from 'express'
import { authenticate, requireRole } from '../../middlewares/authenticate'
import { trucksController } from './trucks.controller'

export const trucksRouter: IRouter = Router()

/**
 * @swagger
 * /api/trucks/active:
 *   get:
 *     summary: Get all active trucks for a city (snapshot for initial map load)
 *     tags: [Trucks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of active trucks with GPS positions
 *       400:
 *         description: cityId is required
 */
trucksRouter.get(
  '/active',
  authenticate,
  (req, res, next) => trucksController.getActive(req, res, next)
)

/**
 * @swagger
 * /api/trucks/{id}/position:
 *   patch:
 *     summary: Update truck GPS position (called by driver app every 10 seconds)
 *     tags: [Trucks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 14.6928
 *               longitude:
 *                 type: number
 *                 example: -17.4467
 *               completionPercent:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Position updated and broadcast via WebSocket
 *       400:
 *         description: Invalid coordinates
 *       404:
 *         description: Truck not found
 */
trucksRouter.patch(
  '/:id/position',
  authenticate,
  requireRole('COMPANY'),
  (req, res, next) => trucksController.updatePosition(req, res, next)
)
