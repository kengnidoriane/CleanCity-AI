import { prisma } from '../../lib/prisma'
import { supabase } from '../../lib/supabase'
import { sendPushNotification } from '../../lib/notifications'
import type { CreateReportInput, UpdateStatusInput } from './reports.schema'

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

  async findByCity(cityId: string, filters: {
    status?: string
    wasteType?: string
    severity?: string
  }) {
    return prisma.wasteReport.findMany({
      where: {
        cityId,
        ...(filters.status && { status: filters.status as any }),
        ...(filters.wasteType && { wasteType: filters.wasteType as any }),
        ...(filters.severity && { severity: filters.severity as any }),
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findByUser(userId: string) {    return prisma.wasteReport.findMany({
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

  async updateStatus(id: string, input: UpdateStatusInput) {
    const report = await prisma.wasteReport.findUnique({ where: { id } })
    if (!report) throw { status: 404, message: 'Report not found' }

    const updated = await prisma.wasteReport.update({
      where: { id },
      data: {
        status: input.status,
        collectedAt: input.status === 'COLLECTED' ? new Date() : undefined,
      },
    })

    // Send push notification to citizen when waste is collected
    if (input.status === 'COLLECTED') {
      const citizen = await prisma.user.findUnique({
        where: { id: report.userId },
        select: { pushToken: true },
      })

      if (citizen?.pushToken) {
        const date = report.createdAt.toLocaleDateString('en-GB')
        // Fire and forget — notification failure must not block the status update
        sendPushNotification(
          citizen.pushToken,
          `Your waste report from ${date} has been collected. Thank you!`
        ).catch(err => console.error('Push notification failed:', err))
      }
    }

    return updated
  }
}

export const reportsService = new ReportsService()
