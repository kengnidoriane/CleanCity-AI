import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger'
import { authRouter } from './modules/auth/auth.router'
import { reportsRouter } from './modules/reports/reports.router'
import { usersRouter } from './modules/users/users.router'
import { errorHandler } from './middlewares/errorHandler'

dotenv.config()

const app = express()
const httpServer = createServer(app)

export const io = new Server(httpServer, {
  cors: { origin: '*' },
})

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
// app.use('/api/routes', routeRouter)
// app.use('/api/trucks', truckRouter)
// app.use('/api/analytics', analyticsRouter)
// app.use('/api/companies', companyRouter)
// app.use('/api/schedules', scheduleRouter)

// Global error handler — must be last
app.use(errorHandler)

const PORT = process.env['PORT'] ?? 3000

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`)
})
