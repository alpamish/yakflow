import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, companyName } = body

    if (!name || !email || !password || !companyName) {
      return NextResponse.json(
        { success: false, error: 'Name, email, password, and company name are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50)

    const existingOrg = await db.organization.findUnique({ where: { slug } })
    const finalSlug = existingOrg ? `${slug}-${Date.now()}` : slug

    const passwordHash = await bcrypt.hash(password, 12)

    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          password: passwordHash,
          isActive: true,
        },
      })

      const organization = await tx.organization.create({
        data: {
          name: companyName,
          slug: finalSlug,
          baseCurrency: 'USD',
        },
      })

      const membership = await tx.organizationUser.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: 'owner',
        },
      })

      return { user, organization, membership }
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          userId: result.user.id,
          email: result.user.email,
          name: result.user.name,
          organizationId: result.organization.id,
          organizationName: result.organization.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
}
