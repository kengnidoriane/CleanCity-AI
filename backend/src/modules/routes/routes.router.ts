import { Router, type IRouter } from 'express'
import { authenticate, requireRole } from '../../middlewares/authenticate'
import { routesController } from './routes.controller'

export const routesRouter: IRouter = Router()

/**
 * @swagger
 * /api/routes/optimize:
 *   post:
 *     summary: Generate an optimized collection route using OR-Tools AI service
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cityId, reportIds, stops]
 *             properties:
 *               cityId:
 *                 type: string
 *                 format: uuid
 *               reportIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               stops:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     reportId:
 *                       type: string
 *                     lat:
 *                       type: number
 *                     lng:
 *                       type: number
 *                     severity:
 *                       type: string
 *                       enum: [LOW, MEDIUM, HIGH]
 *     responses:
 *       201:
 *         description: Optimized route created with DRAFT status
 *       400:
 *         description: Validation error
 *       502:
 *         description: AI service unavailable
 */
routesRouter.post(
  '/optimize',
  authenticate,
  requireRole('COMPANY'),
  (req, res, next) => routesController.optimize(req, res, next)
)

/**
 * @swagger
 * /api/routes/{id}/assign:
 *   post:
 *     summary: Assign a route to a truck — changes status to ACTIVE and reports to ASSIGNED
 *     tags: [Routes]
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
 *             required: [truckId]
 *             properties:
 *               truckId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Route assigned, reports updated to ASSIGNED
 *       403:
 *         description: Truck does not belong to your company
 *       404:
 *         description: Route or truck not found
 */
routesRouter.post(
  '/:id/assign',
  authenticate,
  requireRole('COMPANY'),
  (req, res, next) => routesController.assign(req, res, next)
)

/**
 * @swagger
 * /api/routes/{id}:
 *   get:
 *     summary: Get route details — used by driver interface to see ordered stops
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Route with ordered stops
 *       404:
 *         description: Route not found
 */
routesRouter.get(
  '/:id',
  authenticate,
  (req, res, next) => routesController.getById(req, res, next)
)

/**
 * @swagger
 * /api/routes/{id}/stops/{stopIndex}/complete:
 *   patch:
 *     summary: Mark a stop as collected (driver marks collection complete)
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: stopIndex
 *         required: true
 *         schema:
 *           type: integer
 *         description: Zero-based index of the stop in the route
 *     responses:
 *       200:
 *         description: Stop marked as collected, completion percent updated
 *       400:
 *         description: Stop index out of range
 *       404:
 *         description: Route not found
 */
routesRouter.patch(
  '/:id/stops/:stopIndex/complete',
  authenticate,
  requireRole('COMPANY'),
  (req, res, next) => routesController.completeStop(req, res, next)
)
