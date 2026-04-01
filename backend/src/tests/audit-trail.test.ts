import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { reportsRouter } from '../modules/reports/reports.router'
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
    wasteReport: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    user: { findUnique: vi.fn() },
  },
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/photo.jpg' } }),
      }),
    },
  },
}))

vi.mock('../lib/notifications', () => ({
  sendPushNotification: vi.fn().mockResolvedValue(undefined),
}))

import { prisma } from '../lib/prisma'

const app = express()
app.use(express.json())
app.use('/api/reports', reportsRouter)
app.use(errorHandler)

const mockReports = [
  {
    id: 'r1', userId: 'u1', photoUrl: 'https://test.com/p1.jpg',
    latitude: 14.69, longitude: -17.44, wasteType: 'PLASTIC', severity: 'HIGH',
    status: 'COLLECTED', companyId: 'c1', collectedAt: new Date('2026-03-20'),
    createdAt: new Date('2026-03-19'), cityId: CITY_ID,
  },
  {
    id: 'r2', userId: 'u2', photoUrl: 'https://test.com/p2.jpg',
    latitude: 14.71, longitude: -17.46, wasteType: 'ORGANIC', severity: 'LOW',
    status: 'PENDING', companyId: null, collectedAt: null,
    createdAt: new Date('2026-03-18'), cityId: CITY_ID,
  },
]

describe('GET /api/reports/audit — US-M06 audit trail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return paginated audit trail for a city', async () => {
    vi.mocked(prisma.wasteReport.findMany).mockResolvedValue(mockReports as any)
    vi.mocked(prisma.wasteReport.count).mockResolvedValue(2)

    const res = await request(app)
      .get('/api/reports/audit')
      .query({ cityId: CITY_ID })

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.total).toBe(2)
    expect(res.body.page).toBe(1)
  })

  it('should filter by status', async () => {
    const collected = mockReports.filter(r => r.status === 'COLLECTED')
    vi.mocked(prisma.wasteReport.findMany).mockResolvedValue(collected as any)
    vi.mocked(prisma.wasteReport.count).mockResolvedValue(1)

    const res = await request(app)
      .get('/api/reports/audit')
      .query({ cityId: CITY_ID, status: 'COLLECTED' })

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })

  it('should return 400 if cityId is missing', async () => {
    const res = await request(app).get('/api/reports/audit')
    expect(res.status).toBe(400)
  })
})

describe('GET /api/reports/audit/export — CSV export', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return CSV content with correct headers', async () => {
    vi.mocked(prisma.wasteReport.findMany).mockResolvedValue(mockReports as any)

    const res = await request(app)
      .get('/api/reports/audit/export')
      .query({ cityId: CITY_ID })

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('text/csv')
    expect(res.headers['content-disposition']).toContain('attachment')
    expect(res.text).toContain('id,date,location,wasteType,severity,status,company,collectedAt')
  })
})
