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

import { hotspotService } from '../modules/analytics/analytics.service'

const app = express()
app.use(express.json())
app.use('/api/analytics', analyticsRouter)
app.use(errorHandler)

describe('GET /api/analytics/hotspots — US-M03 waste hotspot map', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return hotspot data with lat, lng, intensity and report count', async () => {
    vi.mocked(hotspotService.getHotspots).mockResolvedValue([
      { lat: 14.69, lng: -17.44, count: 2, intensity: 1.0 },
      { lat: 14.71, lng: -17.46, count: 1, intensity: 0.33 },
    ])

    const res = await request(app)
      .get('/api/analytics/hotspots')
      .query({ cityId: CITY_ID })

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
    expect(res.body[0]).toHaveProperty('lat')
    expect(res.body[0]).toHaveProperty('lng')
    expect(res.body[0]).toHaveProperty('intensity')
    expect(res.body[0]).toHaveProperty('count')
  })

  it('should filter by period', async () => {
    vi.mocked(hotspotService.getHotspots).mockResolvedValue([])

    const res = await request(app)
      .get('/api/analytics/hotspots')
      .query({ cityId: CITY_ID, period: '7' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })

  it('should return 400 if cityId is missing', async () => {
    const res = await request(app).get('/api/analytics/hotspots')
    expect(res.status).toBe(400)
  })
})
