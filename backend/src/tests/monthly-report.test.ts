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
  municipalAnalyticsService: {
    getCityKpis: vi.fn(),
    getCompanyPerformance: vi.fn(),
  },
  hotspotService: { getHotspots: vi.fn() },
  monthlyReportService: { generateReport: vi.fn() },
}))

import { monthlyReportService } from '../modules/analytics/analytics.service'

const app = express()
app.use(express.json())
app.use('/api/analytics', analyticsRouter)
app.use(errorHandler)

describe('GET /api/analytics/monthly-report — US-M07', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return PDF with correct headers', async () => {
    vi.mocked(monthlyReportService.generateReport).mockResolvedValue(
      Buffer.from('%PDF-1.4 mock pdf content')
    )

    const res = await request(app)
      .get('/api/analytics/monthly-report')
      .query({ cityId: CITY_ID, year: '2026', month: '3' })

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('application/pdf')
    expect(res.headers['content-disposition']).toContain('attachment')
  })

  it('should return 400 if cityId is missing', async () => {
    const res = await request(app)
      .get('/api/analytics/monthly-report')
      .query({ year: '2026', month: '3' })

    expect(res.status).toBe(400)
  })

  it('should return 400 if year or month is missing', async () => {
    const res = await request(app)
      .get('/api/analytics/monthly-report')
      .query({ cityId: CITY_ID })

    expect(res.status).toBe(400)
  })
})
