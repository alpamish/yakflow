import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { voyageNumber: { contains: search } },
        { vesselName: { contains: search } },
        { sailingRoute: { contains: search } },
        { departurePort: { contains: search } },
        { arrivalPort: { contains: search } },
        { shippingLine: { contains: search } },
      ]
    }

    if (status) {
      where.status = status
    }

    const orderBy: Record<string, string> = {}
    orderBy[sortBy] = sortOrder

    const [voyages, total] = await Promise.all([
      db.voyage.findMany({
        where,
        include: {
          teuRecords: { select: { loadedTEUs: true, totalTEUs: true, teuUtilization: true } },
          revenues: { select: { amountBase: true } },
          expenses: { select: { amountBase: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.voyage.count({ where }),
    ])

    const data = voyages.map((v) => {
      const latestTeu = v.teuRecords.length > 0 ? v.teuRecords[v.teuRecords.length - 1] : null
      return {
        ...v,
        teuSummary: latestTeu
          ? {
              totalTEUs: latestTeu.totalTEUs,
              loadedTEUs: latestTeu.loadedTEUs,
              teuUtilization: latestTeu.teuUtilization,
            }
          : null,
        totalRevenue: v.revenues.reduce((sum, r) => sum + (r.amountBase || 0), 0),
        totalExpenses: v.expenses.reduce((sum, e) => sum + (e.amountBase || 0), 0),
        teuRecords: undefined,
        revenues: undefined,
        expenses: undefined,
      }
    })

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error listing voyages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch voyages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.vesselName) {
      return NextResponse.json(
        { success: false, error: 'Vessel name is required' },
        { status: 400 }
      )
    }

    const year = new Date().getFullYear()
    const count = await db.voyage.count({
      where: {
        voyageNumber: { startsWith: `VOY-${year}-` },
      },
    })
    const voyageNumber = `VOY-${year}-${String(count + 1).padStart(4, '0')}`

    const voyage = await db.voyage.create({
      data: {
        voyageNumber,
        vesselName: body.vesselName,
        sailingRoute: body.sailingRoute || null,
        departurePort: body.departurePort || null,
        arrivalPort: body.arrivalPort || null,
        etd: body.etd ? new Date(body.etd) : null,
        eta: body.eta ? new Date(body.eta) : null,
        shippingLine: body.shippingLine || null,
        status: body.status || 'planned',
        remarks: body.remarks || null,
        createdBy: body.createdBy || null,
      },
    })

    return NextResponse.json({ success: true, data: voyage }, { status: 201 })
  } catch (error) {
    console.error('Error creating voyage:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create voyage' },
      { status: 500 }
    )
  }
}
