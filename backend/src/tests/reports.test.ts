import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { reportsRouter } from '../modules/reports/reports.router'
import { errorHandler } from '../middlewares/errorHandler'

// Mock authenticate middleware
vi.mock('../middlewares/authenticate', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 'user-uuid', role: 'CITIZEN' }
    next()
  },
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}))

vi.mock('../lib/prisma', () => ({
  prisma: {
    wasteReport: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
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

import { prisma } from '../lib/prisma'

const app = express()
app.use(express.json())
app.use('/api/reports', reportsRouter)
app.use(errorHandler)

describe('POST /api/reports', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should create a waste report and return 201', async () => {
    const mockReport = {
      id: 'report-uuid',
      userId: 'user-uuid',
      photoUrl: 'https://storage.example.com/photo.jpg',
      latitude: 14.6928,
      longitude: -17.4467,
      wasteType: 'PLASTIC',
      severity: 'HIGH',
      status: 'PENDING',
      cityId: 'city-uuid',
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
      .field('cityId', 'city-uuid')

    expect(res.status).toBe(201)
    expect(res.body.id).toBe('report-uuid')
    expect(res.body.status).toBe('PENDING')
  })

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/reports')
      .field('latitude', '14.6928')
    // missing longitude, wasteType, severity, cityId

    expect(res.status).toBe(400)
  })

  it('should return 400 if coordinates are out of range', async () => {
    const res = await request(app)
      .post('/api/reports')
      .field('latitude', '999')
      .field('longitude', '-17.4467')
      .field('wasteType', 'PLASTIC')
      .field('severity', 'HIGH')
      .field('cityId', 'city-uuid')

    expect(res.status).toBe(400)
  })

  it('should return 401 if not authenticated', async () => {
    // Override mock to simulate unauthenticated request
    const unauthApp = express()
    unauthApp.use(express.json())

    const { authenticate } = await import('../middlewares/authenticate')
    vi.mocked(authenticate).mockImplementationOnce((_req, res, _next) => {
      res.status(401).json({ message: 'Missing or invalid authorization header' })
    })

    unauthApp.use('/api/reports', reportsRouter)

    const res = await request(unauthApp)
      .post('/api/reports')
      .field('latitude', '14.6928')
      .field('longitude', '-17.4467')
      .field('wasteType', 'PLASTIC')
      .field('severity', 'HIGH')
      .field('cityId', 'city-uuid')

    expect(res.status).toBe(401)
  })
})

describe('GET /api/reports/mine', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return citizen own reports ordered by most recent', async () => {
    const mockReports = [
      {
        id: 'report-1',
        userId: 'user-uuid',
        photoUrl: 'https://storage.example.com/photo1.jpg',
        latitude: 14.6928,
        longitude: -17.4467,
        wasteType: 'PLASTIC',
        severity: 'HIGH',
        status: 'PENDING',
        cityId: 'city-uuid',
        createdAt: new Date('2026-03-20'),
      },
      {
        id: 'report-2',
        userId: 'user-uuid',
        photoUrl: 'https://storage.example.com/photo2.jpg',
        latitude: 14.693,
        longitude: -17.447,
        wasteType: 'ORGANIC',
        severity: 'LOW',
        status: 'COLLECTED',
        cityId: 'city-uuid',
        createdAt: new Date('2026-03-18'),
      },
    ]

    vi.mocked(prisma.wasteReport.findMany).mockResolvedValue(mockReports as any)

    const res = await request(app).get('/api/reports/mine')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0].id).toBe('report-1')
  })

  it('should return empty array if citizen has no reports', async () => {
    vi.mocked(prisma.wasteReport.findMany).mockResolvedValue([])

    const res = await request(app).get('/api/reports/mine')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })
})
