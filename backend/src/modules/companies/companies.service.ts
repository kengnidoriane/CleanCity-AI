import argon2 from 'argon2'
import nodemailer from 'nodemailer'
import { prisma } from '../../lib/prisma'
import type { RegisterCompanyInput } from './companies.schema'

/** Generate a random temporary password */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

/** Send credentials email to the new company */
async function sendCredentialsEmail(email: string, name: string, password: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env['SMTP_HOST'] ?? 'smtp.gmail.com',
    port: parseInt(process.env['SMTP_PORT'] ?? '587'),
    auth: {
      user: process.env['SMTP_USER'],
      pass: process.env['SMTP_PASS'],
    },
  })

  await transporter.sendMail({
    from: `"Clean City AI" <${process.env['SMTP_USER']}>`,
    to: email,
    subject: 'Your Clean City AI account credentials',
    text: `Welcome ${name}!\n\nYour account has been created.\nEmail: ${email}\nTemporary password: ${password}\n\nPlease change your password after first login.`,
  })
}

export class CompaniesService {
  async register(input: RegisterCompanyInput) {
    // 1. Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email: input.email } })
    if (existing) throw { status: 409, message: 'Email already in use' }

    // 2. Generate temporary password
    const tempPassword = generateTempPassword()
    const passwordHash = await argon2.hash(tempPassword, { type: argon2.argon2id })

    // 3. Create company record
    const company = await prisma.company.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        cityId: input.cityId,
      },
    })

    // 4. Create user account for the company
    await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: 'COMPANY',
        cityId: input.cityId,
      },
    })

    // 5. Send credentials email — fire and forget
    sendCredentialsEmail(input.email, input.name, tempPassword)
      .catch(err => console.error('Failed to send credentials email:', err))

    return { company, message: 'Company registered and credentials sent to email' }
  }

  async findByCity(cityId: string) {
    return prisma.company.findMany({
      where: { cityId },
      orderBy: { name: 'asc' },
    })
  }
}

export const companiesService = new CompaniesService()
