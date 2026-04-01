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

vi.mock('../modules/analytics/analytics.service', () => ({
  analyticsService: { getCompanyStats: vi.fn() },
  municipalAnalyticsService: { getCityKpis: vi.fn(), getCompanyPerformance: vi.fn() },
  hotspotService: { getHotspots: vi.fn() },
}))

import { municipalAnalyticsService } from '../modules/analytics/analytics.service'

const app = express()
app.use(express.json())
app.use('/api/analytics', analyticsRouter)
app.use(errorHandler)

describe('GET /api/analytics/city — US-M02 city KPI dashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return city-wide KPIs', async () => {
    vi.mocked(municipalAnalyticsService.getCityKpis).mockResolvedValue({
      totalActiveReports: 120,
      collectionRate: 71,
      activeTrucks: 8,
      avgResponseTimeMin: 45,
    })

    const res = await request(app)
      .get('/api/analytics/city')
      .query({ cityId: CITY_ID })

    expect(res.status).toBe(200)
    expect(res.body.totalActiveReports).toBe(120)
    expect(res.body.collectionRate).toBe(71)
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
    vi.mocked(municipalAnalyticsService.getCompanyPerformance).mockResolvedValue([
      { id: 'c1', name: 'CleanCo', totalReports: 50, collected: 40, collectionRate: 80, activeTrucks: 3, avgResponseTimeMin: 30 },
    ])

    const res = await request(app)
      .get('/api/analytics/city/companies')
      .query({ cityId: CITY_ID })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('CleanCo')
    expect(res.body[0].collectionRate).toBe(80)
    expect(res.body[0].activeTrucks).toBe(3)
  })
})
