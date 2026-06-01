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
    const isActive = searchParams.get('isActive') || ''

    const where: Record<string, unknown> = { organizationId: orgId }
    if (isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const currencies = await db.currency.findMany({
      where,
      orderBy: { code: 'asc' },
    })

    return NextResponse.json({ success: true, data: currencies })
  } catch (error) {
    console.error('Error listing currencies:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch currencies' },
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

    if (!body.code || !body.name || !body.symbol) {
      return NextResponse.json(
        { success: false, error: 'code, name, and symbol are required' },
        { status: 400 }
      )
    }

    const currency = await db.currency.create({
      data: {
        code: body.code.toUpperCase(),
        name: body.name,
        symbol: body.symbol,
        isActive: body.isActive !== undefined ? body.isActive : true,
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, data: currency }, { status: 201 })
  } catch (error) {
    console.error('Error creating currency:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create currency' },
      { status: 500 }
    )
  }
}
