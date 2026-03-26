import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

export const createScheduleSchema = z.object({
  cityId: z.string().uuid('Invalid city ID'),
  zone: z.string().min(1, 'Zone is required'),
  dayOfWeek: z
    .number()
    .int()
    .min(0, 'Day must be between 0 (Sunday) and 6 (Saturday)')
    .max(6, 'Day must be between 0 (Sunday) and 6 (Saturday)'),
  timeWindowStart: z
    .string()
    .regex(timeRegex, 'Time must be in HH:MM format (e.g. 08:00)'),
  timeWindowEnd: z
    .string()
    .regex(timeRegex, 'Time must be in HH:MM format (e.g. 12:00)'),
})

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>
