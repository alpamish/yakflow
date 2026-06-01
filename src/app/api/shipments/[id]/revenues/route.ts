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

    const shipment = await db.shipment.findFirst({ where: { id, organizationId: orgId } })
    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      )
    }

    const revenues = await db.shipmentRevenue.findMany({
      where: { shipmentId: id },
      include: {
        customer: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: revenues })
  } catch (error) {
    console.error('Error listing shipment revenues:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch revenues' },
      { status: 500 }
    )
  }
}

export async function POST(
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

    const shipment = await db.shipment.findFirst({ where: { id, organizationId: orgId } })
    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      )
    }

    if (!body.revenueType || body.amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'revenueType and amount are required' },
        { status: 400 }
      )
    }

    const revenue = await db.shipmentRevenue.create({
      data: {
        organizationId: orgId,
        shipmentId: id,
        customerId: body.customerId || null,
        revenueType: body.revenueType,
        invoiceNumber: body.invoiceNumber || null,
        quantity: body.quantity ?? 1,
        unitPrice: body.unitPrice ?? 0,
        amount: body.amount,
        notes: body.notes || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        paymentStatus: body.paymentStatus || 'pending',
      },
      include: {
        customer: { select: { id: true, name: true, code: true } },
      },
    })

    return NextResponse.json({ success: true, data: revenue }, { status: 201 })
  } catch (error) {
    console.error('Error creating shipment revenue:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create revenue' },
      { status: 500 }
    )
  }
}
