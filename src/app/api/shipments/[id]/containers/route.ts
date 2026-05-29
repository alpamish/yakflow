import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const shipment = await db.shipment.findUnique({ where: { id } })
    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      )
    }

    const containers = await db.container.findMany({
      where: { shipmentId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: containers })
  } catch (error) {
    console.error('Error listing containers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch containers' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const shipment = await db.shipment.findUnique({ where: { id } })
    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      )
    }

    if (!body.containerNumber) {
      return NextResponse.json(
        { success: false, error: 'Container number is required' },
        { status: 400 }
      )
    }

    const container = await db.container.create({
      data: {
        shipmentId: id,
        containerNumber: body.containerNumber,
        containerType: body.containerType || '20DC',
        containerSize: body.containerSize || '20',
        sealNumber: body.sealNumber || null,
        grossWeight: body.grossWeight || null,
        netWeight: body.netWeight || null,
        volume: body.volume || null,
        quantity: body.quantity || 1,
        status: body.status || 'empty',
        currentLocation: body.currentLocation || null,
        deliveryStatus: body.deliveryStatus || 'pending',
      },
    })

    return NextResponse.json({ success: true, data: container }, { status: 201 })
  } catch (error) {
    console.error('Error creating container:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create container' },
      { status: 500 }
    )
  }
}
