import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { analyticsRouter } from '../modules/analytics/analytics.router'
import { errorHandler } from '../middlewares/errorHandler'

const CITY_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const MUNICIPAL_ID = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'

vi.mock('../middlewares/authenticate', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: MUNICIPAL_ID, role: 'MUNICIPAL' }
    next()
  },
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}))

vi.mock('../lib/prisma', () => ({
  prisma: {
    wasteReport: { count: vi.fn() },
    collectionRoute: { aggregate: vi.fn() },
    truck: { count: vi.fn() },
    company: { findMany: vi.fn() },
  },
}))

import { prisma } from '../lib/prisma'

const app = express()
app.use(express.json())
app.use('/api/analytics', analyticsRouter)
app.use(errorHandler)

describe('GET /api/analytics/city — US-M02 city KPI dashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return city-wide KPIs', async () => {
    vi.mocked(prisma.wasteReport.count)
      .mockResolvedValueOnce(120)  // total active reports
      .mockResolvedValueOnce(85)   // collected
    vi.mocked(prisma.truck.count).mockResolvedValue(8)
    vi.mocked(prisma.collectionRoute.aggregate).mockResolvedValue({
      _avg: { estimatedDurationMin: 45 },
    } as any)

    const res = await request(app)
      .get('/api/analytics/city')
      .query({ cityId: CITY_ID })

    expect(res.status).toBe(200)
    expect(res.body.totalActiveReports).toBe(120)
    expect(res.body.collectionRate).toBe(71) // 85/120 * 100
    expect(res.body.activeTrucks).toBe(8)
    expect(res.body.avgResponseTimeMin).toBe(45)
  })

  it('should return 400 if cityId is missing', async () => {
    const res = await request(app).get('/api/analytics/city')
    expect(res.status).toBe(400)
  })
})

describe('GET /api/analytics/city/companies — US-M04 company performance', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return performance metrics per company', async () => {
    vi.mocked(prisma.company.findMany).mockResolvedValue([
      { id: 'c1', name: 'CleanCo', email: 'a@b.com', phone: null, cityId: CITY_ID, createdAt: new Date() },
    ] as any)
    vi.mocked(prisma.wasteReport.count)
      .mockResolvedValueOnce(50)  // total for c1
      .mockResolvedValueOnce(40)  // collected for c1
    vi.mocked(prisma.truck.count).mockResolvedValue(3)
    vi.mocked(prisma.collectionRoute.aggregate).mockResolvedValue({
      _avg: { estimatedDurationMin: 30 },
    } as any)

    const res = await request(app)
      .get('/api/analytics/city/companies')
      .query({ cityId: CITY_ID })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('CleanCo')
    expect(res.body[0].collectionRate).toBe(80) // 40/50 * 100
    expect(res.body[0].activeTrucks).toBe(3)
  })
})
