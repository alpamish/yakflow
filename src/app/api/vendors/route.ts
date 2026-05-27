import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const isActive = searchParams.get('isActive') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

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

    const [vendors, total] = await Promise.all([
      db.vendor.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      db.vendor.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: vendors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error listing vendors:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Vendor name is required' },
        { status: 400 }
      )
    }

    // Auto-generate code from name
    const baseCode = body.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4)

    const existingCount = await db.vendor.count({
      where: { code: { startsWith: baseCode } },
    })

    const code = existingCount > 0
      ? `${baseCode}${String(existingCount + 1).padStart(3, '0')}`
      : `${baseCode}001`

    const vendor = await db.vendor.create({
      data: {
        name: body.name,
        code,
        type: body.type || null,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        country: body.country || null,
        taxId: body.taxId || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    })

    return NextResponse.json({ success: true, data: vendor }, { status: 201 })
  } catch (error) {
    console.error('Error creating vendor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create vendor' },
      { status: 500 }
    )
  }
}
