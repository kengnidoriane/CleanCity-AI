import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { usersRouter } from '../modules/users/users.router'
import { errorHandler } from '../middlewares/errorHandler'

const USER_ID = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'

vi.mock('../middlewares/authenticate', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: USER_ID, role: 'CITIZEN' }
    next()
  },
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}))

vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}))

import { prisma } from '../lib/prisma'

const app = express()
app.use(express.json())
app.use('/api/users', usersRouter)
app.use(errorHandler)

describe('POST /api/users/push-token', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should register push token for authenticated user', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({ id: USER_ID } as any)

    const res = await request(app)
      .post('/api/users/push-token')
      .send({ pushToken: 'ExponentPushToken[xxxxxx]' })

    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Push token registered successfully')
  })

  it('should return 400 if push token is missing', async () => {
    const res = await request(app)
      .post('/api/users/push-token')
      .send({})

    expect(res.status).toBe(400)
  })

  it('should return 400 if push token format is invalid', async () => {
    const res = await request(app)
      .post('/api/users/push-token')
      .send({ pushToken: 'not-a-valid-expo-token' })

    expect(res.status).toBe(400)
  })
})
