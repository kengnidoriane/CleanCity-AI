import { Router, type IRouter } from 'express'
import multer from 'multer'
import { authenticate, requireRole } from '../../middlewares/authenticate'
import { reportsController } from './reports.controller'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
})

export const reportsRouter: IRouter = Router()

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Submit a new waste report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [latitude, longitude, wasteType, severity, cityId]
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *               latitude:
 *                 type: number
 *                 example: 14.6928
 *               longitude:
 *                 type: number
 *                 example: -17.4467
 *               wasteType:
 *                 type: string
 *                 enum: [PLASTIC, ORGANIC, BULKY, ELECTRONIC, HAZARDOUS, OTHER]
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *               cityId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Report created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
reportsRouter.post(
  '/',
  authenticate,
  requireRole('CITIZEN'),
  upload.single('photo'),
  (req, res, next) => reportsController.create(req, res, next)
)

/**
 * @swagger
 * /api/reports/mine:
 *   get:
 *     summary: Get all reports submitted by the authenticated citizen
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reports ordered by most recent
 *       401:
 *         description: Unauthorized
 */
reportsRouter.get(
  '/mine',
  authenticate,
  requireRole('CITIZEN'),
  (req, res, next) => reportsController.getMine(req, res, next)
)

/**
 * @swagger
 * /api/reports/audit/export:
 *   get:
 *     summary: Export audit trail as CSV (municipal only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cityId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
reportsRouter.get(
  '/audit/export',
  authenticate,
  requireRole('MUNICIPAL'),
  (req, res, next) => reportsController.exportAuditCsv(req, res, next)
)

/**
 * @swagger
 * /api/reports/audit:
 *   get:
 *     summary: Get paginated audit trail with filters (municipal only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cityId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated list of reports with total count
 *       400:
 *         description: cityId is required
 */
reportsRouter.get(
  '/audit',
  authenticate,
  requireRole('MUNICIPAL'),
  (req, res, next) => reportsController.getAuditTrail(req, res, next)
)

/**
 * @swagger
 * /api/reports/city:
 *   get:
 *     summary: Get all reports for a city with optional filters (company/municipal dashboard)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cityId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ASSIGNED, COLLECTED]
 *       - in: query
 *         name: wasteType
 *         schema:
 *           type: string
 *           enum: [PLASTIC, ORGANIC, BULKY, ELECTRONIC, HAZARDOUS, OTHER]
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *     responses:
 *       200:
 *         description: Filtered list of reports ordered by most recent
 *       400:
 *         description: cityId is required
 */
reportsRouter.get(
  '/city',
  authenticate,
  requireRole('COMPANY', 'MUNICIPAL'),
  (req, res, next) => reportsController.getByCity(req, res, next)
)
/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Get a specific report by ID
 *     tags: [Reports]
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
 *         description: Report details
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Report not found
 */
reportsRouter.get(
  '/:id',
  authenticate,
  requireRole('CITIZEN'),
  (req, res, next) => reportsController.getById(req, res, next)
)

/**
 * @swagger
 * /api/reports/{id}/status:
 *   patch:
 *     summary: Update report status (driver marks as collected)
 *     tags: [Reports]
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ASSIGNED, COLLECTED]
 *     responses:
 *       200:
 *         description: Status updated, push notification sent to citizen
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Report not found
 */
reportsRouter.patch(
  '/:id/status',
  authenticate,
  requireRole('COMPANY'),
  (req, res, next) => reportsController.updateStatus(req, res, next)
)
