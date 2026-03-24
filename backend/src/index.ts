import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'

dotenv.config()

const app = express()
const httpServer = createServer(app)

export const io = new Server(httpServer, {
  cors: { origin: '*' }
})

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cleancity-api' })
})

// Routes (added as features are built)
// app.use('/api/auth', authRoutes)
// app.use('/api/reports', reportRoutes)
// app.use('/api/routes', routeRoutes)
// app.use('/api/trucks', truckRoutes)
// app.use('/api/analytics', analyticsRoutes)

const PORT = process.env['PORT'] ?? 3000

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
