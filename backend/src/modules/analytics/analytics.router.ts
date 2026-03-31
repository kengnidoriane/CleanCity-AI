import { Router, type IRouter } from 'express'
import { authenticate, requireRole } from '../../middlewares/authenticate'
import { analyticsController, municipalAnalyticsController, hotspotController, monthlyReportController } from './analytics.controller'

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

/**
 * @swagger
 * /api/analytics/hotspots:
 *   get:
 *     summary: Get waste hotspot data for heatmap visualization — US-M03
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cityId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         required: false
 *         schema:
 *           type: integer
 *         description: Number of days to look back (e.g. 7, 30). Omit for all time.
 *     responses:
 *       200:
 *         description: Array of hotspot points with lat, lng, count and intensity (0-1)
 *       400:
 *         description: cityId is required
 */
analyticsRouter.get(
  '/hotspots',
  authenticate,
  requireRole('MUNICIPAL'),
  (req, res, next) => hotspotController.getHotspots(req, res, next)
)

/**
 * @swagger
 * /api/analytics/monthly-report:
 *   get:
 *     summary: Generate monthly activity report as PDF — US-M07
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cityId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: cityId, year and month are required
 */
analyticsRouter.get(
  '/monthly-report',
  authenticate,
  requireRole('MUNICIPAL'),
  (req, res, next) => monthlyReportController.generateReport(req, res, next)
)
