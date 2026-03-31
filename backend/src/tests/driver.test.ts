import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { routesRouter } from '../modules/routes/routes.router'
import { errorHandler } from '../middlewares/errorHandler'

const ROUTE_ID = 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f'
const COMPANY_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const TRUCK_ID = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'

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
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    truck: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    wasteReport: {
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((fn: any) => fn({
      collectionRoute: { update: vi.fn() },
      truck: { update: vi.fn() },
      wasteReport: { updateMany: vi.fn() },
    })),
  },
}))

vi.mock('../lib/ai-client', () => ({
  callOptimizeRoute: vi.fn(),
}))

vi.mock('../lib/notifications', () => ({
  sendPushNotification: vi.fn().mockResolvedValue(undefined),
}))

import { prisma } from '../lib/prisma'

const app = express()
app.use(express.json())
app.use('/api/routes', routesRouter)
app.use(errorHandler)

const mockStops = [
  { reportId: 'r1', reportIds: ['r1'], lat: 14.69, lng: -17.44, severity: 'HIGH', collected: false },
  { reportId: 'r2', reportIds: ['r2'], lat: 14.71, lng: -17.46, severity: 'LOW', collected: false },
  { reportId: 'r3', reportIds: ['r3'], lat: 14.72, lng: -17.47, severity: 'MEDIUM', collected: false },
]

const mockRoute = {
  id: ROUTE_ID,
  companyId: COMPANY_ID,
  truckId: TRUCK_ID,
  stopSequence: mockStops,
  totalDistanceKm: 5.0,
  estimatedDurationMin: 10,
  status: 'ACTIVE',
  createdAt: new Date(),
}

describe('PATCH /api/routes/:id/stops/:stopIndex/complete', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should mark a stop as collected and update completion percent', async () => {
    const updatedStops = mockStops.map((s, i) => ({ ...s, collected: i === 0 }))
    const updatedRoute = { ...mockRoute, stopSequence: updatedStops }

    vi.mocked(prisma.collectionRoute.findUnique).mockResolvedValue(mockRoute as any)
    vi.mocked(prisma.collectionRoute.update).mockResolvedValue(updatedRoute as any)
    vi.mocked(prisma.wasteReport.update).mockResolvedValue({ id: 'r1', userId: 'user-uuid', createdAt: new Date() } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ pushToken: null } as any)
    vi.mocked(prisma.truck.update).mockResolvedValue({} as any)

    const res = await request(app)
      .patch(`/api/routes/${ROUTE_ID}/stops/0/complete`)

    expect(res.status).toBe(200)
    expect(res.body.stopSequence[0].collected).toBe(true)
    expect(res.body.completionPercent).toBe(33) // 1/3 stops done
  })

  it('should mark route as COMPLETED when all stops are collected', async () => {
    const allCollectedStops = mockStops.map(s => ({ ...s, collected: true }))
    // Only last stop not yet collected
    const twoCollectedStops = mockStops.map((s, i) => ({ ...s, collected: i < 2 }))
    const routeWithTwoCollected = { ...mockRoute, stopSequence: twoCollectedStops }
    const completedRoute = { ...mockRoute, stopSequence: allCollectedStops, status: 'COMPLETED' }

    vi.mocked(prisma.collectionRoute.findUnique).mockResolvedValue(routeWithTwoCollected as any)
    vi.mocked(prisma.collectionRoute.update).mockResolvedValue(completedRoute as any)
    vi.mocked(prisma.wasteReport.update).mockResolvedValue({ id: 'r3', userId: 'user-uuid', createdAt: new Date() } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ pushToken: null } as any)
    vi.mocked(prisma.truck.update).mockResolvedValue({} as any)

    const res = await request(app)
      .patch(`/api/routes/${ROUTE_ID}/stops/2/complete`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('COMPLETED')
  })

  it('should return 404 if route does not exist', async () => {
    vi.mocked(prisma.collectionRoute.findUnique).mockResolvedValue(null)

    const res = await request(app)
      .patch(`/api/routes/nonexistent/stops/0/complete`)

    expect(res.status).toBe(404)
  })

  it('should return 400 if stop index is out of range', async () => {
    vi.mocked(prisma.collectionRoute.findUnique).mockResolvedValue(mockRoute as any)

    const res = await request(app)
      .patch(`/api/routes/${ROUTE_ID}/stops/99/complete`)

    expect(res.status).toBe(400)
  })
})
