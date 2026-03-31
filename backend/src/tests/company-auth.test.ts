import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { authRouter } from '../modules/auth/auth.router'
import { errorHandler } from '../middlewares/errorHandler'

const COMPANY_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    city: { findUnique: vi.fn() },
  },
}))

vi.mock('argon2', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    verify: vi.fn(),
    argon2id: 2,
  },
  hash: vi.fn().mockResolvedValue('hashed_password'),
  verify: vi.fn(),
  argon2id: 2,
}))

import { prisma } from '../lib/prisma'
import argon2 from 'argon2'

const app = express()
app.use(express.json())
app.use('/api/auth', authRouter)
app.use(errorHandler)

const mockCompanyUser = {
  id: COMPANY_ID,
  name: 'CleanCo Dakar',
  phone: null,
  email: 'contact@cleanco.sn',
  passwordHash: 'hashed_password',
  role: 'COMPANY',
  cityId: 'city-uuid',
  createdAt: new Date(),
}

describe('POST /api/auth/login/company', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should login a company manager and return a JWT token', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockCompanyUser as any)
    vi.mocked(argon2.verify).mockResolvedValue(true)

    const res = await request(app)
      .post('/api/auth/login/company')
      .send({ email: 'contact@cleanco.sn', password: 'SecurePass123!' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.role).toBe('COMPANY')
    expect(res.body.user.passwordHash).toBeUndefined()
  })

  it('should return 401 if email does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const res = await request(app)
      .post('/api/auth/login/company')
      .send({ email: 'unknown@cleanco.sn', password: 'SecurePass123!' })

    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid credentials')
  })

  it('should return 401 if password is incorrect', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockCompanyUser as any)
    vi.mocked(argon2.verify).mockResolvedValue(false)

    const res = await request(app)
      .post('/api/auth/login/company')
      .send({ email: 'contact@cleanco.sn', password: 'WrongPass123!' })

    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid credentials')
  })

  it('should return 403 if account is not a COMPANY role', async () => {
    const citizenUser = { ...mockCompanyUser, role: 'CITIZEN' }
    vi.mocked(prisma.user.findUnique).mockResolvedValue(citizenUser as any)
    vi.mocked(argon2.verify).mockResolvedValue(true)

    const res = await request(app)
      .post('/api/auth/login/company')
      .send({ email: 'contact@cleanco.sn', password: 'SecurePass123!' })

    expect(res.status).toBe(403)
    expect(res.body.message).toBe('Access restricted to company accounts')
  })

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login/company')
      .send({ email: 'contact@cleanco.sn' })

    expect(res.status).toBe(400)
  })
})
