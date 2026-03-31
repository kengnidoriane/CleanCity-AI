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

vi.mock('../modules/analytics/analytics.service', () => ({
  analyticsService: { getCompanyStats: vi.fn() },
  municipalAnalyticsService: { getCityKpis: vi.fn(), getCompanyPerformance: vi.fn() },
  hotspotService: { getHotspots: vi.fn() },
}))

import { analyticsService } from '../modules/analytics/analytics.service'

const app = express()
app.use(express.json())
app.use('/api/analytics', analyticsRouter)
app.use(errorHandler)

describe('GET /api/analytics/company', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return performance stats for current period', async () => {
    vi.mocked(analyticsService.getCompanyStats).mockResolvedValue({
      period: 'week',
      current: { totalReports: 50, collected: 35, pending: 15, collectionRate: 70, totalDistanceKm: 120.5 },
      previous: { totalReports: 40, collected: 28, pending: 12, collectionRate: 70, totalDistanceKm: 95 },
    })

    const res = await request(app)
      .get('/api/analytics/company')
      .query({ companyId: COMPANY_ID, period: 'week' })

    expect(res.status).toBe(200)
    expect(res.body.current.totalReports).toBe(50)
    expect(res.body.current.collected).toBe(35)
    expect(res.body.current.pending).toBe(15)
    expect(res.body.current.collectionRate).toBe(70)
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
    vi.mocked(analyticsService.getCompanyStats).mockResolvedValue({
      period: 'day',
      current: { totalReports: 0, collected: 0, pending: 0, collectionRate: 0, totalDistanceKm: 0 },
      previous: { totalReports: 0, collected: 0, pending: 0, collectionRate: 0, totalDistanceKm: 0 },
    })

    const res = await request(app)
      .get('/api/analytics/company')
      .query({ companyId: COMPANY_ID, period: 'day' })

    expect(res.status).toBe(200)
    expect(res.body.current.collectionRate).toBe(0)
    expect(res.body.current.totalDistanceKm).toBe(0)
  })
})
