import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const orgId = session.user.organizationId
    const { id } = await params
    const voyage = await db.voyage.findUnique({
      where: { id, organizationId: orgId },
      include: {
        teuRecords: { orderBy: { recordedAt: 'desc' } },
        revenues: {
          include: {
            customer: { select: { id: true, name: true, code: true } },
            teuRecord: {
              select: {
                id: true,
                totalContainers: true,
                totalTEUs: true,
                loadedTEUs: true,
                emptyTEUs: true,
                twentyFoot: true,
                fortyFoot: true,
                fortyFiveFoot: true,
                reeferUnits: true,
                specialUnits: true,
                recordedAt: true,
              },
            },
          },
        },
        expenses: {
          include: {
            vendor: { select: { id: true, name: true, code: true } },
          },
        },
        shipments: {
          select: {
            id: true,
            shipmentNumber: true,
            direction: true,
            transportMode: true,
            status: true,
            originCountry: true,
            destinationCountry: true,
            vesselName: true,
            voyageNumber: true,
            etd: true,
            eta: true,
            containers: {
              select: {
                id: true,
                containerNumber: true,
                containerType: true,
                containerSize: true,
                quantity: true,
                status: true,
              },
            },
          },
        },
      },
    })

    if (!voyage) {
      return NextResponse.json(
        { success: false, error: 'Voyage not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: voyage })
  } catch (error) {
    console.error('Error fetching voyage:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch voyage' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const orgId = session.user.organizationId
    const { id } = await params
    const body = await request.json()

    const existing = await db.voyage.findUnique({ where: { id, organizationId: orgId } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Voyage not found' },
        { status: 404 }
      )
    }

    const voyage = await db.voyage.update({
      where: { id, organizationId: orgId },
      data: {
        vesselName: body.vesselName,
        sailingRoute: body.sailingRoute ?? null,
        departurePort: body.departurePort ?? null,
        arrivalPort: body.arrivalPort ?? null,
        etd: body.etd ? new Date(body.etd) : null,
        eta: body.eta ? new Date(body.eta) : null,
        shippingLine: body.shippingLine ?? null,
        status: body.status,
        remarks: body.remarks ?? null,
      },
    })

    return NextResponse.json({ success: true, data: voyage })
  } catch (error) {
    console.error('Error updating voyage:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update voyage' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const orgId = session.user.organizationId
    const { id } = await params

    const existing = await db.voyage.findUnique({ where: { id, organizationId: orgId } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Voyage not found' },
        { status: 404 }
      )
    }

    await db.voyage.delete({ where: { id, organizationId: orgId } })

    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    console.error('Error deleting voyage:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete voyage' },
      { status: 500 }
    )
  }
}
