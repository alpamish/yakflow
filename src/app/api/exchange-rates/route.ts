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
    const fromCurrency = searchParams.get('fromCurrency') || ''
    const toCurrency = searchParams.get('toCurrency') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { organizationId: orgId }

    if (fromCurrency) {
      where.fromCurrency = fromCurrency
    }

    if (toCurrency) {
      where.toCurrency = toCurrency
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        (where.date as Record<string, unknown>).gte = new Date(startDate)
      }
      if (endDate) {
        (where.date as Record<string, unknown>).lte = new Date(endDate)
      }
    }

    const orderBy: Record<string, string> = {}
    orderBy[sortBy] = sortOrder

    const [rates, total] = await Promise.all([
      db.exchangeRate.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      db.exchangeRate.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: rates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error listing exchange rates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exchange rates' },
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

    if (!body.fromCurrency || !body.toCurrency || body.rate === undefined || !body.date) {
      return NextResponse.json(
        { success: false, error: 'fromCurrency, toCurrency, rate, and date are required' },
        { status: 400 }
      )
    }

    const rate = await db.exchangeRate.create({
      data: {
        fromCurrency: body.fromCurrency.toUpperCase(),
        toCurrency: body.toCurrency.toUpperCase(),
        rate: body.rate,
        date: new Date(body.date),
        source: body.source || null,
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, data: rate }, { status: 201 })
  } catch (error) {
    console.error('Error creating exchange rate:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create exchange rate' },
      { status: 500 }
    )
  }
}
