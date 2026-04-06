import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { createServer } from 'http'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger'
import { initSocket } from './lib/socket'
import { authRouter } from './modules/auth/auth.router'
import { reportsRouter } from './modules/reports/reports.router'
import { usersRouter } from './modules/users/users.router'
import { schedulesRouter } from './modules/schedules/schedules.router'
import { trucksRouter } from './modules/trucks/trucks.router'
import { routesRouter } from './modules/routes/routes.router'
import { analyticsRouter } from './modules/analytics/analytics.router'
import { companiesRouter } from './modules/companies/companies.router'
import { errorHandler } from './middlewares/errorHandler'
import { startAlertMonitor } from './jobs/alert-monitor'

dotenv.config()

const app = express()
const httpServer = createServer(app)

export const io = initSocket(httpServer)

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Swagger docs — available at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cleancity-api' })
})

// Routes
app.use('/api/auth', authRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/users', usersRouter)
app.use('/api/schedules', schedulesRouter)
app.use('/api/trucks', trucksRouter)
app.use('/api/routes', routesRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/companies', companiesRouter)

// WebSocket — clients join city room to receive real-time truck positions
io.on('connection', (socket) => {
  socket.on('join_city', (cityId: string) => {
    socket.join(`city:${cityId}`)
  })

  socket.on('leave_city', (cityId: string) => {
    socket.leave(`city:${cityId}`)
  })
})

// Global error handler — must be last
app.use(errorHandler)

const PORT = process.env['PORT'] ?? 3000

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`)
  startAlertMonitor()
  console.log('Alert monitor started — checking every 30 seconds')
})
