import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; containerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const orgId = session.user.organizationId
    const { id, containerId } = await params
    const body = await request.json()

    const shipment = await db.shipment.findFirst({ where: { id, organizationId: orgId } })
    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      )
    }

    const existing = await db.container.findFirst({ where: { id: containerId, organizationId: orgId } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Container not found' },
        { status: 404 }
      )
    }

    const container = await db.container.update({
      where: { id: containerId, organizationId: orgId },
      data: {
        containerNumber: body.containerNumber ?? undefined,
        containerType: body.containerType ?? undefined,
        containerSize: body.containerSize ?? undefined,
        sealNumber: body.sealNumber ?? undefined,
        grossWeight: body.grossWeight ?? undefined,
        netWeight: body.netWeight ?? undefined,
        volume: body.volume ?? undefined,
        quantity: body.quantity ?? undefined,
        status: body.status ?? undefined,
        currentLocation: body.currentLocation ?? undefined,
        deliveryStatus: body.deliveryStatus ?? undefined,
      },
    })

    return NextResponse.json({ success: true, data: container })
  } catch (error) {
    console.error('Error updating container:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update container' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; containerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const orgId = session.user.organizationId
    const { id, containerId } = await params

    const shipment = await db.shipment.findFirst({ where: { id, organizationId: orgId } })
    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      )
    }

    const existing = await db.container.findFirst({ where: { id: containerId, organizationId: orgId } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Container not found' },
        { status: 404 }
      )
    }

    await db.container.delete({ where: { id: containerId, organizationId: orgId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting container:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete container' },
      { status: 500 }
    )
  }
}
