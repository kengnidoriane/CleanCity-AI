import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { trucksRouter } from '../modules/trucks/trucks.router'
import { errorHandler } from '../middlewares/errorHandler'

const CITY_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

vi.mock('../middlewares/authenticate', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 'driver-uuid', role: 'COMPANY' }
    next()
  },
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}))

vi.mock('../lib/prisma', () => ({
  prisma: {
    truck: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { prisma } from '../lib/prisma'

const app = express()
app.use(express.json())
app.use('/api/trucks', trucksRouter)
app.use(errorHandler)

const mockTruck = {
  id: 'truck-uuid',
  name: 'Truck 01',
  companyId: 'company-uuid',
  driverId: 'driver-uuid',
  currentLat: 14.6928,
  currentLng: -17.4467,
  lastUpdated: new Date(),
  completionPercent: 45,
  isActive: true,
  activeRouteId: null,
}

describe('GET /api/trucks/active', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return all active trucks for a city', async () => {
    vi.mocked(prisma.truck.findMany).mockResolvedValue([mockTruck] as any)

    const res = await request(app)
      .get('/api/trucks/active')
      .query({ cityId: CITY_ID })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].isActive).toBe(true)
    expect(res.body[0].currentLat).toBe(14.6928)
  })

  it('should return 400 if cityId is missing', async () => {
    const res = await request(app).get('/api/trucks/active')
    expect(res.status).toBe(400)
  })

  it('should return empty array if no active trucks', async () => {
    vi.mocked(prisma.truck.findMany).mockResolvedValue([])

    const res = await request(app)
      .get('/api/trucks/active')
      .query({ cityId: CITY_ID })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })
})

describe('PATCH /api/trucks/:id/position', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should update truck GPS position', async () => {
    const updatedTruck = { ...mockTruck, currentLat: 14.7000, currentLng: -17.4500, lastUpdated: new Date() }
    vi.mocked(prisma.truck.findUnique).mockResolvedValue(mockTruck as any)
    vi.mocked(prisma.truck.update).mockResolvedValue(updatedTruck as any)

    const res = await request(app)
      .patch('/api/trucks/truck-uuid/position')
      .send({ latitude: 14.7000, longitude: -17.4500 })

    expect(res.status).toBe(200)
    expect(res.body.currentLat).toBe(14.7000)
  })

  it('should return 400 if coordinates are invalid', async () => {
    const res = await request(app)
      .patch('/api/trucks/truck-uuid/position')
      .send({ latitude: 999, longitude: -17.4500 })

    expect(res.status).toBe(400)
  })

  it('should return 404 if truck does not exist', async () => {
    vi.mocked(prisma.truck.findUnique).mockResolvedValue(null)

    const res = await request(app)
      .patch('/api/trucks/nonexistent/position')
      .send({ latitude: 14.7000, longitude: -17.4500 })

    expect(res.status).toBe(404)
  })
})
