import { Router, type IRouter } from 'express'
import { authenticate, requireRole } from '../../middlewares/authenticate'
import { schedulesController } from './schedules.controller'

export const schedulesRouter: IRouter = Router()

/**
 * @swagger
 * /api/schedules:
 *   post:
 *     summary: Create a collection schedule for a zone (company only)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cityId, zone, dayOfWeek, timeWindowStart, timeWindowEnd]
 *             properties:
 *               cityId:
 *                 type: string
 *                 format: uuid
 *               zone:
 *                 type: string
 *                 example: Plateau
 *               dayOfWeek:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 6
 *                 description: 0=Sunday, 1=Monday, ..., 6=Saturday
 *               timeWindowStart:
 *                 type: string
 *                 example: "08:00"
 *               timeWindowEnd:
 *                 type: string
 *                 example: "12:00"
 *     responses:
 *       201:
 *         description: Schedule created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
schedulesRouter.post(
  '/',
  authenticate,
  requireRole('COMPANY'),
  (req, res, next) => schedulesController.create(req, res, next)
)

/**
 * @swagger
 * /api/schedules:
 *   get:
 *     summary: Get collection schedules for a city or specific zone
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cityId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: zone
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by zone name
 *     responses:
 *       200:
 *         description: List of schedules ordered by zone and day
 *       400:
 *         description: cityId is required
 */
schedulesRouter.get(
  '/',
  authenticate,
  (req, res, next) => schedulesController.getByZone(req, res, next)
)

/**
 * @swagger
 * /api/schedules/{id}:
 *   delete:
 *     summary: Delete a schedule (company owner only)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Schedule deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Schedule not found
 */
schedulesRouter.delete(
  '/:id',
  authenticate,
  requireRole('COMPANY'),
  (req, res, next) => schedulesController.remove(req, res, next)
)
