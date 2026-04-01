import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { schedulesRouter } from '../modules/schedules/schedules.router'
import { errorHandler } from '../middlewares/errorHandler'

// Valid UUIDs v4 for tests
const CITY_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const SCHEDULE_ID = 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a'

vi.mock('../middlewares/authenticate', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 'company-uuid', role: 'COMPANY' }
    next()
  },
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}))

vi.mock('../lib/prisma', () => ({
  prisma: {
    schedule: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    company: {
      findFirst: vi.fn(),
    },
  },
}))

import { prisma } from '../lib/prisma'

const app = express()
app.use(express.json())
app.use('/api/schedules', schedulesRouter)
app.use(errorHandler)

const mockSchedule = {
  id: SCHEDULE_ID,
  companyId: 'company-uuid',
  cityId: CITY_ID,
  zone: 'Plateau',
  dayOfWeek: 1,
  timeWindowStart: '08:00',
  timeWindowEnd: '12:00',
}

describe('POST /api/schedules', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should create a schedule and return 201', async () => {
    vi.mocked(prisma.company.findFirst).mockResolvedValue({ id: 'company-uuid' } as any)
    vi.mocked(prisma.schedule.create).mockResolvedValue(mockSchedule as any)

    const res = await request(app)
      .post('/api/schedules')
      .send({
        cityId: CITY_ID,
        zone: 'Plateau',
        dayOfWeek: 1,
        timeWindowStart: '08:00',
        timeWindowEnd: '12:00',
      })

    expect(res.status).toBe(201)
    expect(res.body.zone).toBe('Plateau')
  })

  it('should return 400 if dayOfWeek is out of range', async () => {
    const res = await request(app)
      .post('/api/schedules')
      .send({
        cityId: 'city-uuid',
        zone: 'Plateau',
        dayOfWeek: 8, // invalid
        timeWindowStart: '08:00',
        timeWindowEnd: '12:00',
      })

    expect(res.status).toBe(400)
  })

  it('should return 400 if time format is invalid', async () => {
    const res = await request(app)
      .post('/api/schedules')
      .send({
        cityId: 'city-uuid',
        zone: 'Plateau',
        dayOfWeek: 1,
        timeWindowStart: '25:00', // invalid
        timeWindowEnd: '12:00',
      })

    expect(res.status).toBe(400)
  })
})

describe('GET /api/schedules', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return schedules filtered by zone', async () => {
    vi.mocked(prisma.schedule.findMany).mockResolvedValue([mockSchedule] as any)

    const res = await request(app)
      .get('/api/schedules')
      .query({ zone: 'Plateau', cityId: 'city-uuid' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].zone).toBe('Plateau')
  })

  it('should return empty array if no schedules for zone', async () => {
    vi.mocked(prisma.schedule.findMany).mockResolvedValue([])

    const res = await request(app)
      .get('/api/schedules')
      .query({ zone: 'Unknown', cityId: 'city-uuid' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })
})

describe('DELETE /api/schedules/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should delete a schedule and return 204', async () => {
    vi.mocked(prisma.schedule.findUnique).mockResolvedValue(mockSchedule as any)
    vi.mocked(prisma.schedule.delete).mockResolvedValue(mockSchedule as any)

    const res = await request(app).delete(`/api/schedules/${SCHEDULE_ID}`)

    expect(res.status).toBe(204)
  })

  it('should return 404 if schedule does not exist', async () => {
    vi.mocked(prisma.schedule.findUnique).mockResolvedValue(null)

    const res = await request(app).delete('/api/schedules/nonexistent')

    expect(res.status).toBe(404)
  })
})
