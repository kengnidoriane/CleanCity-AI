import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { authRouter } from '../modules/auth/auth.router'

const app = express()
app.use(express.json())
app.use('/api/auth', authRouter)

// Mock prisma to avoid real DB calls in unit tests
vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    city: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '../lib/prisma'

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should register a citizen and return a JWT token', async () => {
    const mockCity = { id: 'city-uuid', name: 'Dakar', country: 'Senegal' }
    const mockUser = {
      id: 'user-uuid',
      name: 'Doriane',
      phone: '+237600000000',
      email: null,
      role: 'CITIZEN',
      cityId: 'city-uuid',
      createdAt: new Date(),
    }

    vi.mocked(prisma.city.findUnique).mockResolvedValue(mockCity as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null) // phone not taken
    vi.mocked(prisma.user.create).mockResolvedValue({ ...mockUser, passwordHash: 'hashed' } as any)

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Doriane',
        phone: '+237600000000',
        password: 'SecurePass123!',
        cityId: 'city-uuid',
      })

    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.phone).toBe('+237600000000')
    expect(res.body.user.passwordHash).toBeUndefined()
  })

  it('should return 409 if phone number already exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'existing' } as any)

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Doriane',
        phone: '+237600000000',
        password: 'SecurePass123!',
        cityId: 'city-uuid',
      })

    expect(res.status).toBe(409)
    expect(res.body.message).toBe('Phone number already in use')
  })

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Doriane' }) // missing phone, password, cityId

    expect(res.status).toBe(400)
  })

  it('should return 400 if password is too weak', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Doriane',
        phone: '+237600000000',
        password: '123', // too short
        cityId: 'city-uuid',
      })

    expect(res.status).toBe(400)
  })

  it('should return 404 if city does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.city.findUnique).mockResolvedValue(null)

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Doriane',
        phone: '+237600000000',
        password: 'SecurePass123!',
        cityId: 'invalid-city-uuid',
      })

    expect(res.status).toBe(404)
    expect(res.body.message).toBe('City not found')
  })
})
