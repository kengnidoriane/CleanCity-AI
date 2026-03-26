import { prisma } from '../../lib/prisma'
import { supabase } from '../../lib/supabase'
import type { CreateReportInput } from './reports.schema'

export class ReportsService {
  async create(input: CreateReportInput, userId: string, photo?: Express.Multer.File) {
    // 1. Upload photo to Supabase Storage if provided
    let photoUrl = ''
    if (photo) {
      const fileName = `reports/${userId}/${Date.now()}-${photo.originalname}`
      const { error } = await supabase.storage
        .from('waste-photos')
        .upload(fileName, photo.buffer, { contentType: photo.mimetype })

      if (error) throw { status: 500, message: 'Failed to upload photo' }

      const { data } = supabase.storage
        .from('waste-photos')
        .getPublicUrl(fileName)

      photoUrl = data.publicUrl
    }

    // 2. Create report in database
    const report = await prisma.wasteReport.create({
      data: {
        userId,
        photoUrl,
        latitude: input.latitude,
        longitude: input.longitude,
        wasteType: input.wasteType,
        severity: input.severity,
        cityId: input.cityId,
        status: 'PENDING',
      },
    })

    return report
  }

  async findByUser(userId: string) {
    return prisma.wasteReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string, userId: string) {
    const report = await prisma.wasteReport.findUnique({ where: { id } })
    if (!report) throw { status: 404, message: 'Report not found' }
    if (report.userId !== userId) throw { status: 403, message: 'Forbidden' }
    return report
  }
}

export const reportsService = new ReportsService()
