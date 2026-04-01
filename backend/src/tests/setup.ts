import { beforeAll, afterAll } from 'vitest'

beforeAll(() => {
  // Global test setup
  process.env['JWT_SECRET'] = 'test-secret-key-for-vitest'
  process.env['DATABASE_URL'] = 'postgresql://localhost:5432/test'
  process.env['SUPABASE_URL'] = 'https://test.supabase.co'
  process.env['SUPABASE_KEY'] = 'test-key'
})

afterAll(() => {
  // Global test teardown
})
