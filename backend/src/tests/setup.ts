import { beforeAll, afterAll } from 'vitest'
import { prisma } from '../lib/prisma'

beforeAll(async () => {
  // runs before all tests
})

afterAll(async () => {
  await prisma.$disconnect()
})
