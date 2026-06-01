import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const orgId = session.user.organizationId

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const isActive = searchParams.get('isActive') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { organizationId: orgId }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { email: { contains: search } },
        { country: { contains: search } },
      ]
    }

    if (type) {
      where.type = type
    }

    if (isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const orderBy: Record<string, string> = {}
    orderBy[sortBy] = sortOrder

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      db.customer.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error listing customers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const orgId = session.user.organizationId

    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required' },
        { status: 400 }
      )
    }

    // Auto-generate code from name
    const baseCode = body.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4)

    const existingCount = await db.customer.count({
      where: { code: { startsWith: baseCode } },
    })

    const code = existingCount > 0
      ? `${baseCode}${String(existingCount + 1).padStart(3, '0')}`
      : `${baseCode}001`

    const customer = await db.customer.create({
      data: {
        name: body.name,
        code,
        type: body.type || 'both',
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        country: body.country || null,
        taxId: body.taxId || null,
        creditLimit: body.creditLimit || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, data: customer }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
