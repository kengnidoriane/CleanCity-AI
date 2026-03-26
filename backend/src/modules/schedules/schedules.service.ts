import { prisma } from '../../lib/prisma'
import type { CreateScheduleInput } from './schedules.schema'

export class SchedulesService {
  async create(input: CreateScheduleInput, companyId: string) {
    return prisma.schedule.create({
      data: {
        companyId,
        cityId: input.cityId,
        zone: input.zone,
        dayOfWeek: input.dayOfWeek,
        timeWindowStart: input.timeWindowStart,
        timeWindowEnd: input.timeWindowEnd,
      },
    })
  }

  async findByZone(zone: string, cityId: string) {
    return prisma.schedule.findMany({
      where: { zone, cityId },
      orderBy: { dayOfWeek: 'asc' },
    })
  }

  async findByCity(cityId: string) {
    return prisma.schedule.findMany({
      where: { cityId },
      orderBy: [{ zone: 'asc' }, { dayOfWeek: 'asc' }],
    })
  }

  async delete(id: string, companyId: string) {
    const schedule = await prisma.schedule.findUnique({ where: { id } })
    if (!schedule) throw { status: 404, message: 'Schedule not found' }
    if (schedule.companyId !== companyId) throw { status: 403, message: 'Forbidden' }

    await prisma.schedule.delete({ where: { id } })
  }
}

export const schedulesService = new SchedulesService()
