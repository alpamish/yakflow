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
    const shipment = await db.shipment.findFirst({
      where: { id, organizationId: orgId },
      include: {
        customer: true,
        voyage: true,
        containers: true,
        expenses: {
          include: {
            vendor: { select: { id: true, name: true, code: true } },
          },
        },
        revenues: {
          include: {
            customer: { select: { id: true, name: true, code: true } },
          },
        },
      },
    })

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: shipment })
  } catch (error) {
    console.error('Error fetching shipment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shipment' },
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

    const existing = await db.shipment.findFirst({ where: { id, organizationId: orgId } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      )
    }

    const shipment = await db.shipment.update({
      where: { id, organizationId: orgId },
      data: {
        direction: body.direction,
        transportMode: body.transportMode,
        customerId: body.customerId ?? null,
        shipper: body.shipper ?? null,
        consignee: body.consignee ?? null,
        notifyParty: body.notifyParty ?? null,
        bookingNumber: body.bookingNumber ?? null,
        blNumber: body.blNumber ?? null,
        awbNumber: body.awbNumber ?? null,
        cargoType: body.cargoType ?? null,
        imoClass: body.imoClass ?? null,
        originCountry: body.originCountry ?? null,
        destinationCountry: body.destinationCountry ?? null,
        portOfLoading: body.portOfLoading ?? null,
        portOfDischarge: body.portOfDischarge ?? null,
        finalDestination: body.finalDestination ?? null,
        etd: body.etd ? new Date(body.etd) : null,
        eta: body.eta ? new Date(body.eta) : null,
        vesselName: body.vesselName ?? null,
        voyageNumber: body.voyageNumber ?? null,
        voyageId: body.voyageId ?? null,
        freeDays: body.freeDays ?? null,
        status: body.status,
        remarks: body.remarks ?? null,
      },
      include: {
        customer: { select: { id: true, name: true, code: true } },
        voyage: { select: { id: true, voyageNumber: true, vesselName: true } },
      },
    })

    return NextResponse.json({ success: true, data: shipment })
  } catch (error) {
    console.error('Error updating shipment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update shipment' },
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

    const existing = await db.shipment.findFirst({ where: { id, organizationId: orgId } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      )
    }

    await db.shipment.delete({ where: { id, organizationId: orgId } })

    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    console.error('Error deleting shipment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete shipment' },
      { status: 500 }
    )
  }
}
