import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { routesRouter } from '../modules/routes/routes.router'
import { errorHandler } from '../middlewares/errorHandler'

const COMPANY_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const TRUCK_ID = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'
const ROUTE_ID = 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f'
const CITY_ID = 'd4e5f6a7-b8c9-4d0e-8f2a-3b4c5d6e7f8a'

vi.mock('../middlewares/authenticate', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: COMPANY_ID, role: 'COMPANY' }
    next()
  },
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}))

vi.mock('../lib/prisma', () => ({
  prisma: {
    collectionRoute: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    truck: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    wasteReport: {
      updateMany: vi.fn(),
    },
  },
}))

vi.mock('../lib/ai-client', () => ({
  callOptimizeRoute: vi.fn(),
}))

import { prisma } from '../lib/prisma'
import { callOptimizeRoute } from '../lib/ai-client'

const app = express()
app.use(express.json())
app.use('/api/routes', routesRouter)
app.use(errorHandler)

const mockOptimizeResult = {
  orderedStops: [
    { reportId: 'r1', reportIds: ['r1'], lat: 14.69, lng: -17.44, severity: 'HIGH' },
    { reportId: 'r2', reportIds: ['r2'], lat: 14.71, lng: -17.46, severity: 'LOW' },
  ],
  totalDistanceKm: 3.5,
  estimatedDurationMin: 7,
}

const mockRoute = {
  id: ROUTE_ID,
  companyId: COMPANY_ID,
  truckId: null,
  stopSequence: mockOptimizeResult.orderedStops,
  optimizedPath: null,
  totalDistanceKm: 3.5,
  estimatedDurationMin: 7,
  status: 'DRAFT',
  createdAt: new Date(),
}

describe('POST /api/routes/optimize', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should call AI service and save the optimized route', async () => {
    vi.mocked(callOptimizeRoute).mockResolvedValue(mockOptimizeResult)
    vi.mocked(prisma.collectionRoute.create).mockResolvedValue(mockRoute as any)

    const res = await request(app)
      .post('/api/routes/optimize')
      .send({
        cityId: CITY_ID,
        reportIds: ['r1', 'r2'],
        stops: [
          { reportId: 'r1', lat: 14.69, lng: -17.44, severity: 'HIGH' },
          { reportId: 'r2', lat: 14.71, lng: -17.46, severity: 'LOW' },
        ],
      })

    expect(res.status).toBe(201)
    expect(res.body.totalDistanceKm).toBe(3.5)
    expect(res.body.status).toBe('DRAFT')
    expect(callOptimizeRoute).toHaveBeenCalledOnce()
  })

  it('should return 400 if stops list is empty', async () => {
    const res = await request(app)
      .post('/api/routes/optimize')
      .send({ cityId: CITY_ID, reportIds: [], stops: [] })

    expect(res.status).toBe(400)
  })
})

describe('POST /api/routes/:id/assign', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should assign route to truck and update report statuses to ASSIGNED', async () => {
    const assignedRoute = { ...mockRoute, truckId: TRUCK_ID, status: 'ACTIVE' }

    vi.mocked(prisma.collectionRoute.findUnique).mockResolvedValue(mockRoute as any)
    vi.mocked(prisma.truck.findUnique).mockResolvedValue({ id: TRUCK_ID, companyId: COMPANY_ID } as any)
    vi.mocked(prisma.collectionRoute.update).mockResolvedValue(assignedRoute as any)
    vi.mocked(prisma.truck.update).mockResolvedValue({} as any)
    vi.mocked(prisma.wasteReport.updateMany).mockResolvedValue({ count: 2 } as any)

    const res = await request(app)
      .post(`/api/routes/${ROUTE_ID}/assign`)
      .send({ truckId: TRUCK_ID })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ACTIVE')
    expect(res.body.truckId).toBe(TRUCK_ID)
    expect(prisma.wasteReport.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'ASSIGNED', companyId: COMPANY_ID } })
    )
  })

  it('should return 404 if route does not exist', async () => {
    vi.mocked(prisma.collectionRoute.findUnique).mockResolvedValue(null)

    const res = await request(app)
      .post(`/api/routes/nonexistent/assign`)
      .send({ truckId: TRUCK_ID })

    expect(res.status).toBe(404)
  })

  it('should return 403 if truck belongs to a different company', async () => {
    vi.mocked(prisma.collectionRoute.findUnique).mockResolvedValue(mockRoute as any)
    vi.mocked(prisma.truck.findUnique).mockResolvedValue({ id: TRUCK_ID, companyId: 'other-company' } as any)

    const res = await request(app)
      .post(`/api/routes/${ROUTE_ID}/assign`)
      .send({ truckId: TRUCK_ID })

    expect(res.status).toBe(403)
  })
})

describe('GET /api/routes/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return route details for driver interface', async () => {
    vi.mocked(prisma.collectionRoute.findUnique).mockResolvedValue(mockRoute as any)

    const res = await request(app).get(`/api/routes/${ROUTE_ID}`)

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(ROUTE_ID)
    expect(res.body.stopSequence).toHaveLength(2)
  })

  it('should return 404 if route does not exist', async () => {
    vi.mocked(prisma.collectionRoute.findUnique).mockResolvedValue(null)

    const res = await request(app).get('/api/routes/nonexistent')

    expect(res.status).toBe(404)
  })
})
