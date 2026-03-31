import { z } from 'zod'

export const updatePositionSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  completionPercent: z.number().min(0).max(100).optional(),
})

export type UpdatePositionInput = z.infer<typeof updatePositionSchema>
