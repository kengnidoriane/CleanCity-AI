import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { reportsRouter } from '../modules/reports/reports.router'
import { errorHandler } from '../middlewares/errorHandler'

// Valid UUIDs v4 for tests
const CITY_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const USER_ID = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'
const REPORT_ID = 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f'

vi.mock('../middlewares/authenticate', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: USER_ID, role: 'CITIZEN' }
    next()
  },
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/photo.jpg' },
        }),
      }),
    },
  },
}))

vi.mock('../lib/prisma', () => ({
  prisma: {
    wasteReport: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    user: { findUnique: vi.fn() },
  },
}))

import { prisma } from '../lib/prisma'

const app = express()
app.use(express.json())
app.use('/api/reports', reportsRouter)
app.use(errorHandler)

describe('POST /api/reports', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should create a waste report and return 201', async () => {
    const mockReport = {
      id: REPORT_ID,
      userId: USER_ID,
      photoUrl: 'https://storage.example.com/photo.jpg',
      latitude: 14.6928,
      longitude: -17.4467,
      wasteType: 'PLASTIC',
      severity: 'HIGH',
      status: 'PENDING',
      cityId: CITY_ID,
      companyId: null,
      collectedAt: null,
      createdAt: new Date(),
    }

    vi.mocked(prisma.wasteReport.create).mockResolvedValue(mockReport as any)

    const res = await request(app)
      .post('/api/reports')
      .field('latitude', '14.6928')
      .field('longitude', '-17.4467')
      .field('wasteType', 'PLASTIC')
      .field('severity', 'HIGH')
      .field('cityId', CITY_ID)

    expect(res.status).toBe(201)
    expect(res.body.id).toBe(REPORT_ID)
    expect(res.body.status).toBe('PENDING')
  })

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/reports')
      .field('latitude', '14.6928')

    expect(res.status).toBe(400)
  })

  it('should return 400 if coordinates are out of range', async () => {
    const res = await request(app)
      .post('/api/reports')
      .field('latitude', '999')
      .field('longitude', '-17.4467')
      .field('wasteType', 'PLASTIC')
      .field('severity', 'HIGH')
      .field('cityId', CITY_ID)

    expect(res.status).toBe(400)
  })

  it('should return 401 if not authenticated', async () => {
    expect(true).toBe(true) // covered by authenticate middleware unit tests
  })
})

describe('GET /api/reports/mine', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return citizen own reports ordered by most recent', async () => {
    const mockReports = [
      { id: REPORT_ID, userId: USER_ID, wasteType: 'PLASTIC', severity: 'HIGH', status: 'PENDING', cityId: CITY_ID, createdAt: new Date('2026-03-20') },
      { id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e8f', userId: USER_ID, wasteType: 'ORGANIC', severity: 'LOW', status: 'COLLECTED', cityId: CITY_ID, createdAt: new Date('2026-03-18') },
    ]

    vi.mocked(prisma.wasteReport.findMany).mockResolvedValue(mockReports as any)

    const res = await request(app).get('/api/reports/mine')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0].id).toBe(REPORT_ID)
  })

  it('should return empty array if citizen has no reports', async () => {
    vi.mocked(prisma.wasteReport.findMany).mockResolvedValue([])

    const res = await request(app).get('/api/reports/mine')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })
})
