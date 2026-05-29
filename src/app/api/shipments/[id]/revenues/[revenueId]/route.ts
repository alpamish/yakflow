import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; revenueId: string }> }
) {
  try {
    const { id, revenueId } = await params
    const body = await request.json()

    const shipment = await db.shipment.findUnique({ where: { id } })
    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      )
    }

    const existing = await db.shipmentRevenue.findUnique({ where: { id: revenueId } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Revenue not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (body.customerId !== undefined) updateData.customerId = body.customerId || null
    if (body.revenueType !== undefined) updateData.revenueType = body.revenueType
    if (body.invoiceNumber !== undefined) updateData.invoiceNumber = body.invoiceNumber || null
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.exchangeRate !== undefined) {
      updateData.exchangeRate = body.exchangeRate
      const amount = body.amount ?? existing.amount
      const tax = body.tax ?? existing.tax
      updateData.amountBase = amount * body.exchangeRate
      updateData.taxBase = tax * body.exchangeRate
    }
    if (body.amount !== undefined) {
      updateData.amount = body.amount
      const rate = body.exchangeRate ?? existing.exchangeRate
      updateData.amountBase = body.amount * rate
    }
    if (body.tax !== undefined) {
      updateData.tax = body.tax
      const rate = body.exchangeRate ?? existing.exchangeRate
      updateData.taxBase = body.tax * rate
    }
    if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null

    const revenue = await db.shipmentRevenue.update({
      where: { id: revenueId },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: revenue })
  } catch (error) {
    console.error('Error updating revenue:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update revenue' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; revenueId: string }> }
) {
  try {
    const { id, revenueId } = await params

    const shipment = await db.shipment.findUnique({ where: { id } })
    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      )
    }

    const existing = await db.shipmentRevenue.findUnique({ where: { id: revenueId } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Revenue not found' },
        { status: 404 }
      )
    }

    await db.shipmentRevenue.delete({ where: { id: revenueId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting revenue:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete revenue' },
      { status: 500 }
    )
  }
}
