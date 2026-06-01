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
    const status = searchParams.get('status') || ''
    const direction = searchParams.get('direction') || ''
    const transportMode = searchParams.get('transportMode') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { organizationId: orgId }

    if (search) {
      where.OR = [
        { shipmentNumber: { contains: search } },
        { blNumber: { contains: search } },
        { bookingNumber: { contains: search } },
        { shipper: { contains: search } },
        { consignee: { contains: search } },
        { vesselName: { contains: search } },
        { voyageNumber: { contains: search } },
        { voyage: { voyageNumber: { contains: search } } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (direction) {
      where.direction = direction
    }

    if (transportMode) {
      where.transportMode = transportMode
    }

    if (startDate || endDate) {
      where.etd = {}
      if (startDate) {
        (where.etd as Record<string, unknown>).gte = new Date(startDate)
      }
      if (endDate) {
        (where.etd as Record<string, unknown>).lte = new Date(endDate)
      }
    }

    const orderBy: Record<string, string> = {}
    orderBy[sortBy] = sortOrder

    const [shipments, total] = await Promise.all([
      db.shipment.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, code: true } },
          voyage: { select: { id: true, voyageNumber: true, vesselName: true, status: true } },
          containers: { select: { id: true } },
          expenses: { select: { amount: true } },
          revenues: { select: { amount: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.shipment.count({ where }),
    ])

    const data = shipments.map((s) => ({
      ...s,
      containerCount: s.containers.length,
      totalExpenses: s.expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
      totalRevenues: s.revenues.reduce((sum, r) => sum + (r.amount || 0), 0),
      containers: undefined,
      expenses: undefined,
      revenues: undefined,
    }))

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
    console.error('Error listing shipments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shipments' },
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

    const year = new Date().getFullYear()
    const count = await db.shipment.count({
      where: {
        organizationId: orgId,
        shipmentNumber: { startsWith: `SHP-${year}-` },
      },
    })
    const shipmentNumber = `SHP-${year}-${String(count + 1).padStart(4, '0')}`

    const shipment = await db.shipment.create({
      data: {
        organizationId: orgId,
        shipmentNumber,
        direction: body.direction || 'import',
        transportMode: body.transportMode || 'sea',
        customerId: body.customerId || null,
        shipper: body.shipper || null,
        consignee: body.consignee || null,
        notifyParty: body.notifyParty || null,
        bookingNumber: body.bookingNumber || null,
        blNumber: body.blNumber || null,
        awbNumber: body.awbNumber || null,
        cargoType: body.cargoType || null,
        imoClass: body.imoClass || null,
        originCountry: body.originCountry || null,
        destinationCountry: body.destinationCountry || null,
        portOfLoading: body.portOfLoading || null,
        portOfDischarge: body.portOfDischarge || null,
        finalDestination: body.finalDestination || null,
        etd: body.etd ? new Date(body.etd) : null,
        eta: body.eta ? new Date(body.eta) : null,
        vesselName: body.vesselName || null,
        voyageNumber: body.voyageNumber || null,
        voyageId: body.voyageId || null,
        freeDays: body.freeDays || null,
        status: body.status || 'draft',
        remarks: body.remarks || null,
        createdBy: body.createdBy || null,
      },
      include: {
        customer: { select: { id: true, name: true, code: true } },
        voyage: { select: { id: true, voyageNumber: true, vesselName: true } },
      },
    })

    return NextResponse.json({ success: true, data: shipment }, { status: 201 })
  } catch (error) {
    console.error('Error creating shipment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create shipment' },
      { status: 500 }
    )
  }
}
