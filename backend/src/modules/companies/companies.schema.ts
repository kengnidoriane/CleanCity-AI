import { z } from 'zod'

export const registerCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  cityId: z.string().uuid('Invalid city ID'),
})

export type RegisterCompanyInput = z.infer<typeof registerCompanySchema>
