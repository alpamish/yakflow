import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = { isActive: true }

    if (type) {
      where.type = type
    }

    if (search) {
      where.OR = [
        { value: { contains: search } },
        { label: { contains: search } },
      ]
    }

    const types = await db.chargeType.findMany({
      where,
      orderBy: { label: 'asc' },
    })

    return NextResponse.json({ success: true, data: types })
  } catch (error) {
    console.error('Error listing charge types:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch charge types' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.type || !body.value || !body.label) {
      return NextResponse.json(
        { success: false, error: 'type, value, and label are required' },
        { status: 400 }
      )
    }

    if (!['expense', 'revenue'].includes(body.type)) {
      return NextResponse.json(
        { success: false, error: 'type must be expense or revenue' },
        { status: 400 }
      )
    }

    const existing = await db.chargeType.findUnique({
      where: { type_value: { type: body.type, value: body.value } },
    })

    if (existing) {
      return NextResponse.json({ success: true, data: existing })
    }

    const chargeType = await db.chargeType.create({
      data: {
        type: body.type,
        value: body.value,
        label: body.label,
      },
    })

    return NextResponse.json({ success: true, data: chargeType }, { status: 201 })
  } catch (error) {
    console.error('Error creating charge type:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create charge type' },
      { status: 500 }
    )
  }
}
