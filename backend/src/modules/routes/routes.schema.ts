import { z } from 'zod'

export const optimizeRouteSchema = z.object({
  cityId: z.string().uuid('Invalid city ID'),
  reportIds: z.array(z.string()).min(1, 'At least one report is required'),
  stops: z.array(z.object({
    reportId: z.string(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  })).min(1, 'At least one stop is required'),
})

export const assignRouteSchema = z.object({
  truckId: z.string().min(1, 'Truck ID is required'),
})

export type OptimizeRouteInput = z.infer<typeof optimizeRouteSchema>
export type AssignRouteInput = z.infer<typeof assignRouteSchema>
