import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma'
import type { RegisterInput, LoginInput } from './auth.schema'

export class AuthService {
  async register(input: RegisterInput) {
    // 1. Check city exists
    const city = await prisma.city.findUnique({
      where: { id: input.cityId },
    })
    if (!city) {
      throw { status: 404, message: 'City not found' }
    }

    // 2. Check phone uniqueness
    const existing = await prisma.user.findUnique({
      where: { phone: input.phone },
    })
    if (existing) {
      throw { status: 409, message: 'Phone number already in use' }
    }

    // 3. Hash password with argon2id
    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
    })

    // 4. Create user
    const user = await prisma.user.create({
      data: {
        name: input.name,
        phone: input.phone,
        passwordHash,
        role: 'CITIZEN',
        cityId: input.cityId,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        cityId: true,
        createdAt: true,
        // passwordHash intentionally excluded
      },
    })

    // 5. Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env['JWT_SECRET'] as string,
      { expiresIn: '24h' }
    )

    return { user, token }
  }

  async login(input: LoginInput) {
    // 1. Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone: input.phone },
    })

    // 2. Generic error — never reveal if phone exists or not (security)
    if (!user) {
      throw { status: 401, message: 'Invalid credentials' }
    }

    // 3. Verify password
    const isValid = await argon2.verify(user.passwordHash, input.password)
    if (!isValid) {
      throw { status: 401, message: 'Invalid credentials' }
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env['JWT_SECRET'] as string,
      { expiresIn: '24h' }
    )

    // 5. Return user without passwordHash
    const { passwordHash: _, ...safeUser } = user

    return { user: safeUser, token }
  }
}

export const authService = new AuthService()
