import { z } from 'zod'

export const createReportSchema = z.object({
  latitude: z.coerce
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z.coerce
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  wasteType: z.enum(
    ['PLASTIC', 'ORGANIC', 'BULKY', 'ELECTRONIC', 'HAZARDOUS', 'OTHER'],
    { error: 'Invalid waste type' }
  ),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH'], { error: 'Invalid severity' }),
  cityId: z.string().uuid('Invalid city ID'),
})

export type CreateReportInput = z.infer<typeof createReportSchema>

export const updateStatusSchema = z.object({
  status: z.enum(['ASSIGNED', 'COLLECTED'], { error: 'Status must be ASSIGNED or COLLECTED' }),
})

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>
