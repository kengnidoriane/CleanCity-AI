import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { analyticsRouter } from '../modules/analytics/analytics.router'
import { errorHandler } from '../middlewares/errorHandler'

const COMPANY_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

vi.mock('../middlewares/authenticate', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: COMPANY_ID, role: 'COMPANY' }
    next()
  },
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}))

vi.mock('../lib/prisma', () => ({
  prisma: {
    wasteReport: {
      count: vi.fn(),
    },
    collectionRoute: {
      aggregate: vi.fn(),
    },
  },
}))

import { prisma } from '../lib/prisma'

const app = express()
app.use(express.json())
app.use('/api/analytics', analyticsRouter)
app.use(errorHandler)

describe('GET /api/analytics/company', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return performance stats for current period', async () => {
    vi.mocked(prisma.wasteReport.count)
      .mockResolvedValueOnce(50)   // total current
      .mockResolvedValueOnce(35)   // collected current
      .mockResolvedValueOnce(15)   // pending current
      .mockResolvedValueOnce(40)   // total previous
      .mockResolvedValueOnce(28)   // collected previous

    vi.mocked(prisma.collectionRoute.aggregate).mockResolvedValue({
      _sum: { totalDistanceKm: 120.5 },
    } as any)

    const res = await request(app)
      .get('/api/analytics/company')
      .query({ companyId: COMPANY_ID, period: 'week' })

    expect(res.status).toBe(200)
    expect(res.body.current.totalReports).toBe(50)
    expect(res.body.current.collected).toBe(35)
    expect(res.body.current.pending).toBe(15)
    expect(res.body.current.collectionRate).toBe(70) // 35/50 * 100
    expect(res.body.current.totalDistanceKm).toBe(120.5)
    expect(res.body.previous.collected).toBe(28)
  })

  it('should return 400 if period is invalid', async () => {
    const res = await request(app)
      .get('/api/analytics/company')
      .query({ companyId: COMPANY_ID, period: 'invalid' })

    expect(res.status).toBe(400)
  })

  it('should return 400 if companyId is missing', async () => {
    const res = await request(app)
      .get('/api/analytics/company')
      .query({ period: 'day' })

    expect(res.status).toBe(400)
  })

  it('should handle zero reports gracefully', async () => {
    vi.mocked(prisma.wasteReport.count).mockResolvedValue(0)
    vi.mocked(prisma.collectionRoute.aggregate).mockResolvedValue({
      _sum: { totalDistanceKm: null },
    } as any)

    const res = await request(app)
      .get('/api/analytics/company')
      .query({ companyId: COMPANY_ID, period: 'day' })

    expect(res.status).toBe(200)
    expect(res.body.current.collectionRate).toBe(0)
    expect(res.body.current.totalDistanceKm).toBe(0)
  })
})
