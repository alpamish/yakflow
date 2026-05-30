import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; revenueId: string }> }
) {
  try {
    const { id, revenueId } = await params
    const body = await request.json()

    const voyage = await db.voyage.findUnique({ where: { id } })
    if (!voyage) {
      return NextResponse.json(
        { success: false, error: 'Voyage not found' },
        { status: 404 }
      )
    }

    const existing = await db.voyageRevenue.findUnique({ where: { id: revenueId } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Revenue not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (body.customerId !== undefined) updateData.customerId = body.customerId || null
    if (body.teuRecordId !== undefined) updateData.teuRecordId = body.teuRecordId || null
    if (body.revenueType !== undefined) updateData.revenueType = body.revenueType
    if (body.invoiceNumber !== undefined) updateData.invoiceNumber = body.invoiceNumber || null
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.quantity !== undefined) updateData.quantity = body.quantity
    if (body.weight !== undefined) updateData.weight = body.weight
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null

    const revenue = await db.voyageRevenue.update({
      where: { id: revenueId },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, code: true } },
        teuRecord: true,
      },
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

    const voyage = await db.voyage.findUnique({ where: { id } })
    if (!voyage) {
      return NextResponse.json(
        { success: false, error: 'Voyage not found' },
        { status: 404 }
      )
    }

    const existing = await db.voyageRevenue.findUnique({ where: { id: revenueId } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Revenue not found' },
        { status: 404 }
      )
    }

    await db.voyageRevenue.delete({ where: { id: revenueId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting revenue:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete revenue' },
      { status: 500 }
    )
  }
}
