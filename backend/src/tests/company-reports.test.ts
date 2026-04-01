import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { reportsRouter } from '../modules/reports/reports.router'
import { errorHandler } from '../middlewares/errorHandler'

const CITY_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

vi.mock('../middlewares/authenticate', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 'company-uuid', role: 'COMPANY' }
    next()
  },
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}))

vi.mock('../lib/prisma', () => ({
  prisma: {
    wasteReport: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
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
  { id: 'r1', userId: 'u1', wasteType: 'PLASTIC', severity: 'HIGH', status: 'PENDING', cityId: CITY_ID, latitude: 14.69, longitude: -17.44, createdAt: new Date('2026-03-20') },
  { id: 'r2', userId: 'u2', wasteType: 'ORGANIC', severity: 'LOW', status: 'ASSIGNED', cityId: CITY_ID, latitude: 14.70, longitude: -17.45, createdAt: new Date('2026-03-19') },
  { id: 'r3', userId: 'u3', wasteType: 'PLASTIC', severity: 'MEDIUM', status: 'COLLECTED', cityId: CITY_ID, latitude: 14.71, longitude: -17.46, createdAt: new Date('2026-03-18') },
]

describe('GET /api/reports/city — US-E02 reports map dashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return all active reports for a city', async () => {
    vi.mocked(prisma.wasteReport.findMany).mockResolvedValue(mockReports as any)

    const res = await request(app)
      .get('/api/reports/city')
      .query({ cityId: CITY_ID })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(3)
  })

  it('should return 400 if cityId is missing', async () => {
    const res = await request(app).get('/api/reports/city')
    expect(res.status).toBe(400)
  })

  it('should filter by status — US-E03', async () => {
    const pending = mockReports.filter(r => r.status === 'PENDING')
    vi.mocked(prisma.wasteReport.findMany).mockResolvedValue(pending as any)

    const res = await request(app)
      .get('/api/reports/city')
      .query({ cityId: CITY_ID, status: 'PENDING' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].status).toBe('PENDING')
  })

  it('should filter by wasteType — US-E03', async () => {
    const plastic = mockReports.filter(r => r.wasteType === 'PLASTIC')
    vi.mocked(prisma.wasteReport.findMany).mockResolvedValue(plastic as any)

    const res = await request(app)
      .get('/api/reports/city')
      .query({ cityId: CITY_ID, wasteType: 'PLASTIC' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  it('should filter by severity — US-E03', async () => {
    const high = mockReports.filter(r => r.severity === 'HIGH')
    vi.mocked(prisma.wasteReport.findMany).mockResolvedValue(high as any)

    const res = await request(app)
      .get('/api/reports/city')
      .query({ cityId: CITY_ID, severity: 'HIGH' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })

  it('should return empty array if no reports match filters', async () => {
    vi.mocked(prisma.wasteReport.findMany).mockResolvedValue([])

    const res = await request(app)
      .get('/api/reports/city')
      .query({ cityId: CITY_ID, status: 'PENDING', wasteType: 'ELECTRONIC' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })
})
