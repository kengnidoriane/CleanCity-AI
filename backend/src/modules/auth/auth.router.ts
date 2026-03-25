import { Router, type IRouter } from 'express'
import { authController } from './auth.controller'

export const authRouter: IRouter = Router()

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new citizen
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, password, cityId]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Doriane Keptue
 *               phone:
 *                 type: string
 *                 example: "+237600000000"
 *               password:
 *                 type: string
 *                 example: SecurePass123!
 *               cityId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Validation error
 *       404:
 *         description: City not found
 *       409:
 *         description: Phone number already in use
 */
authRouter.post('/register', (req, res, next) =>
  authController.register(req, res, next)
)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with phone number and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, password]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+237600000000"
 *               password:
 *                 type: string
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
authRouter.post('/login', (req, res, next) =>
  authController.login(req, res, next)
)
