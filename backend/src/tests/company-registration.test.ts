import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { companiesRouter } from '../modules/companies/companies.router'
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
    company: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('argon2', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed_password'), argon2id: 2 },
  hash: vi.fn().mockResolvedValue('hashed_password'),
  argon2id: 2,
}))

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' }),
    }),
  },
}))

import { prisma } from '../lib/prisma'

const app = express()
app.use(express.json())
app.use('/api/companies', companiesRouter)
app.use(errorHandler)

describe('POST /api/companies — US-M08 company registration', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should register a company and create its user account', async () => {
    const mockCompany = {
      id: 'company-uuid',
      name: 'CleanCo Dakar',
      email: 'contact@cleanco.sn',
      phone: '+221700000000',
      cityId: CITY_ID,
      createdAt: new Date(),
    }
    const mockUser = {
      id: 'user-uuid',
      name: 'CleanCo Dakar',
      email: 'contact@cleanco.sn',
      role: 'COMPANY',
      cityId: CITY_ID,
    }

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.company.create).mockResolvedValue(mockCompany as any)
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any)

    const res = await request(app)
      .post('/api/companies')
      .send({
        name: 'CleanCo Dakar',
        email: 'contact@cleanco.sn',
        phone: '+221700000000',
        cityId: CITY_ID,
      })

    expect(res.status).toBe(201)
    expect(res.body.company.name).toBe('CleanCo Dakar')
    expect(res.body.message).toContain('credentials sent')
  })

  it('should return 409 if email already exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'existing' } as any)

    const res = await request(app)
      .post('/api/companies')
      .send({
        name: 'CleanCo Dakar',
        email: 'contact@cleanco.sn',
        phone: '+221700000000',
        cityId: CITY_ID,
      })

    expect(res.status).toBe(409)
    expect(res.body.message).toBe('Email already in use')
  })

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/companies')
      .send({ name: 'CleanCo' })

    expect(res.status).toBe(400)
  })
})

describe('GET /api/companies — list companies in city', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return all companies for a city', async () => {
    vi.mocked(prisma.company.findMany).mockResolvedValue([
      { id: 'c1', name: 'CleanCo', email: 'a@b.com', phone: null, cityId: CITY_ID, createdAt: new Date() },
    ] as any)

    const res = await request(app)
      .get('/api/companies')
      .query({ cityId: CITY_ID })

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })
})
