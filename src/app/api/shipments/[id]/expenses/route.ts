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

    const expenses = await db.shipmentExpense.findMany({
      where: { shipmentId: id },
      include: {
        vendor: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: expenses })
  } catch (error) {
    console.error('Error listing shipment expenses:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expenses' },
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

    if (!body.expenseType || body.amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'expenseType and amount are required' },
        { status: 400 }
      )
    }

    const expense = await db.shipmentExpense.create({
      data: {
        shipmentId: id,
        expenseType: body.expenseType,
        vendorId: body.vendorId || null,
        quantity: body.quantity ?? 1,
        unitPrice: body.unitPrice ?? 0,
        amount: body.amount,
        paymentStatus: body.paymentStatus || 'pending',
        invoiceNumber: body.invoiceNumber || null,
        notes: body.notes || null,
        attachmentUrl: body.attachmentUrl || null,
        expenseDate: body.expenseDate ? new Date(body.expenseDate) : new Date(),
      },
      include: {
        vendor: { select: { id: true, name: true, code: true } },
      },
    })

    return NextResponse.json({ success: true, data: expense }, { status: 201 })
  } catch (error) {
    console.error('Error creating shipment expense:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}
