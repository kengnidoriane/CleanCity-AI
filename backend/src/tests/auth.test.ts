import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { authRouter } from '../modules/auth/auth.router'

// Valid UUIDs v4 for tests
const CITY_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const USER_ID = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'

const app = express()
app.use(express.json())
app.use('/api/auth', authRouter)

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

vi.mock('argon2', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    verify: vi.fn().mockResolvedValue(true),
    argon2id: 2,
  },
  hash: vi.fn().mockResolvedValue('hashed_password'),
  verify: vi.fn().mockResolvedValue(true),
  argon2id: 2,
}))

import { prisma } from '../lib/prisma'
import argon2 from 'argon2'

describe('POST /api/auth/register', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should register a citizen and return a JWT token', async () => {
    const mockCity = { id: CITY_ID, name: 'Dakar', country: 'Senegal' }
    const mockUser = {
      id: USER_ID,
      name: 'Doriane',
      phone: '+237600000000',
      email: null,
      role: 'CITIZEN',
      cityId: CITY_ID,
      createdAt: new Date(),
    }

    vi.mocked(prisma.city.findUnique).mockResolvedValue(mockCity as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue({ ...mockUser } as any)

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Doriane', phone: '+237600000000', password: 'SecurePass123!', cityId: CITY_ID })

    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.phone).toBe('+237600000000')
    expect(res.body.user.passwordHash).toBeUndefined()
  })

  it('should return 409 if phone number already exists', async () => {
    vi.mocked(prisma.city.findUnique).mockResolvedValue({ id: CITY_ID } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: USER_ID } as any)

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Doriane', phone: '+237600000000', password: 'SecurePass123!', cityId: CITY_ID })

    expect(res.status).toBe(409)
    expect(res.body.message).toBe('Phone number already in use')
  })

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Doriane' })

    expect(res.status).toBe(400)
  })

  it('should return 400 if password is too weak', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Doriane', phone: '+237600000000', password: '123', cityId: CITY_ID })

    expect(res.status).toBe(400)
  })

  it('should return 404 if city does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.city.findUnique).mockResolvedValue(null)

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Doriane', phone: '+237600000000', password: 'SecurePass123!', cityId: CITY_ID })

    expect(res.status).toBe(404)
    expect(res.body.message).toBe('City not found')
  })
})

describe('POST /api/auth/login', () => {
  const mockUser = {
    id: USER_ID,
    name: 'Doriane',
    phone: '+237600000000',
    email: null,
    passwordHash: 'hashed_password',
    role: 'CITIZEN',
    cityId: CITY_ID,
    createdAt: new Date(),
  }

  beforeEach(() => vi.clearAllMocks())

  it('should login successfully and return a JWT token', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
    vi.mocked(argon2.verify).mockResolvedValue(true)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: '+237600000000', password: 'SecurePass123!' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.phone).toBe('+237600000000')
    expect(res.body.user.passwordHash).toBeUndefined()
  })

  it('should return 401 if phone number does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: '+237600000000', password: 'SecurePass123!' })

    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid credentials')
  })

  it('should return 401 if password is incorrect', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
    vi.mocked(argon2.verify).mockResolvedValue(false)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: '+237600000000', password: 'WrongPassword1!' })

    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid credentials')
  })

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: '+237600000000' })

    expect(res.status).toBe(400)
  })
})
