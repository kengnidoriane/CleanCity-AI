import { Router, type IRouter } from 'express'
import { authenticate, requireRole } from '../../middlewares/authenticate'
import { analyticsController, municipalAnalyticsController } from './analytics.controller'

export const analyticsRouter: IRouter = Router()

/**
 * @swagger
 * /api/analytics/company:
 *   get:
 *     summary: Get company performance stats with period comparison
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *     responses:
 *       200:
 *         description: Performance stats for current and previous period
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: string
 *                 current:
 *                   type: object
 *                   properties:
 *                     totalReports:
 *                       type: number
 *                     collected:
 *                       type: number
 *                     pending:
 *                       type: number
 *                     collectionRate:
 *                       type: number
 *                     totalDistanceKm:
 *                       type: number
 *                 previous:
 *                   type: object
 *       400:
 *         description: Invalid period or missing companyId
 */
analyticsRouter.get(
  '/company',
  authenticate,
  requireRole('COMPANY', 'MUNICIPAL'),
  (req, res, next) => analyticsController.getCompanyStats(req, res, next)
)

/**
 * @swagger
 * /api/analytics/city:
 *   get:
 *     summary: Get city-wide KPIs for municipal dashboard — US-M02
 *     tags: [Analytics]
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
 *         description: City KPIs including collection rate, active trucks, response time
 *       400:
 *         description: cityId is required
 */
analyticsRouter.get(
  '/city',
  authenticate,
  requireRole('MUNICIPAL'),
  (req, res, next) => municipalAnalyticsController.getCityKpis(req, res, next)
)

/**
 * @swagger
 * /api/analytics/city/companies:
 *   get:
 *     summary: Get performance metrics per company for municipal monitoring — US-M04
 *     tags: [Analytics]
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
 *         description: List of companies sorted by collection rate descending
 *       400:
 *         description: cityId is required
 */
analyticsRouter.get(
  '/city/companies',
  authenticate,
  requireRole('MUNICIPAL'),
  (req, res, next) => municipalAnalyticsController.getCompanyPerformance(req, res, next)
)
