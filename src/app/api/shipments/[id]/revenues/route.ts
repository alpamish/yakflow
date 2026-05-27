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
    const { id } = await params
    const body = await request.json()

    const shipment = await db.shipment.findUnique({ where: { id } })
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

    const exchangeRate = body.exchangeRate || 1
    const amount = body.amount
    const tax = body.tax || 0
    const amountBase = amount * exchangeRate
    const taxBase = tax * exchangeRate

    const revenue = await db.shipmentRevenue.create({
      data: {
        shipmentId: id,
        customerId: body.customerId || null,
        revenueType: body.revenueType,
        invoiceNumber: body.invoiceNumber || null,
        currency: body.currency || 'USD',
        exchangeRate,
        amount,
        tax,
        amountBase,
        taxBase,
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
