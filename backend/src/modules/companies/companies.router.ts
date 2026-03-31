import { Router, type IRouter } from 'express'
import { authenticate, requireRole } from '../../middlewares/authenticate'
import { companiesController } from './companies.controller'

export const companiesRouter: IRouter = Router()

/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: Register a new collection company (municipal only)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, cityId]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               cityId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Company registered and credentials sent by email
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already in use
 */
companiesRouter.post(
  '/',
  authenticate,
  requireRole('MUNICIPAL'),
  (req, res, next) => companiesController.register(req, res, next)
)

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: List all companies in a city
 *     tags: [Companies]
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
 *         description: List of companies
 *       400:
 *         description: cityId is required
 */
companiesRouter.get(
  '/',
  authenticate,
  requireRole('MUNICIPAL'),
  (req, res, next) => companiesController.list(req, res, next)
)
