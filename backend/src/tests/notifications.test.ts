import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { reportsRouter } from '../modules/reports/reports.router'
import { errorHandler } from '../middlewares/errorHandler'

vi.mock('../middlewares/authenticate', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 'driver-uuid', role: 'COMPANY' }
    next()
  },
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}))

vi.mock('../lib/prisma', () => ({
  prisma: {
    wasteReport: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('../lib/notifications', () => ({
  sendPushNotification: vi.fn().mockResolvedValue(undefined),
}))

import { prisma } from '../lib/prisma'
import { sendPushNotification } from '../lib/notifications'

const app = express()
app.use(express.json())
app.use('/api/reports', reportsRouter)
app.use(errorHandler)

describe('PATCH /api/reports/:id/status', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should update report status to COLLECTED and send push notification', async () => {
    const mockReport = {
      id: 'report-uuid',
      userId: 'citizen-uuid',
      status: 'ASSIGNED',
      wasteType: 'PLASTIC',
      createdAt: new Date('2026-03-20'),
    }
    const mockCitizen = {
      id: 'citizen-uuid',
      pushToken: 'ExponentPushToken[xxxxxx]',
    }
    const updatedReport = { ...mockReport, status: 'COLLECTED', collectedAt: new Date() }

    vi.mocked(prisma.wasteReport.findUnique).mockResolvedValue(mockReport as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockCitizen as any)
    vi.mocked(prisma.wasteReport.update).mockResolvedValue(updatedReport as any)

    const res = await request(app)
      .patch('/api/reports/report-uuid/status')
      .send({ status: 'COLLECTED' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('COLLECTED')
    expect(sendPushNotification).toHaveBeenCalledWith(
      'ExponentPushToken[xxxxxx]',
      expect.stringContaining('collected')
    )
  })

  it('should return 404 if report does not exist', async () => {
    vi.mocked(prisma.wasteReport.findUnique).mockResolvedValue(null)

    const res = await request(app)
      .patch('/api/reports/nonexistent/status')
      .send({ status: 'COLLECTED' })

    expect(res.status).toBe(404)
  })

  it('should return 400 if status is invalid', async () => {
    const res = await request(app)
      .patch('/api/reports/report-uuid/status')
      .send({ status: 'INVALID_STATUS' })

    expect(res.status).toBe(400)
  })

  it('should update status without notification if citizen has no push token', async () => {
    const mockReport = {
      id: 'report-uuid',
      userId: 'citizen-uuid',
      status: 'ASSIGNED',
      createdAt: new Date(),
    }
    const mockCitizen = { id: 'citizen-uuid', pushToken: null }
    const updatedReport = { ...mockReport, status: 'COLLECTED', collectedAt: new Date() }

    vi.mocked(prisma.wasteReport.findUnique).mockResolvedValue(mockReport as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockCitizen as any)
    vi.mocked(prisma.wasteReport.update).mockResolvedValue(updatedReport as any)

    const res = await request(app)
      .patch('/api/reports/report-uuid/status')
      .send({ status: 'COLLECTED' })

    expect(res.status).toBe(200)
    expect(sendPushNotification).not.toHaveBeenCalled()
  })
})

describe('POST /api/users/push-token', () => {
  it('should register push token for authenticated user', async () => {
    const userApp = express()
    userApp.use(express.json())

    const { usersRouter } = await import('../modules/users/users.router')
    userApp.use('/api/users', usersRouter)
    userApp.use(errorHandler)

    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-uuid' } as any)

    const res = await request(userApp)
      .post('/api/users/push-token')
      .send({ pushToken: 'ExponentPushToken[xxxxxx]' })

    expect(res.status).toBe(200)
  })
})
