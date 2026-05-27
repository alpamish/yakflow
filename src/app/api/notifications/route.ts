import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const userId = searchParams.get('userId') || ''
    const isRead = searchParams.get('isRead') || ''
    const type = searchParams.get('type') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (userId) {
      where.userId = userId
    }

    if (isRead !== '') {
      where.isRead = isRead === 'true'
    }

    if (type) {
      where.type = type
    }

    const orderBy: Record<string, string> = {}
    orderBy[sortBy] = sortOrder

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      db.notification.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error listing notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Notification id is required' },
        { status: 400 }
      )
    }

    const existing = await db.notification.findUnique({
      where: { id: body.id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      )
    }

    const notification = await db.notification.update({
      where: { id: body.id },
      data: {
        isRead: body.isRead !== undefined ? body.isRead : true,
      },
    })

    return NextResponse.json({ success: true, data: notification })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}
