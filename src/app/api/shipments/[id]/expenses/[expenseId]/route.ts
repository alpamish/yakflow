import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const orgId = session.user.organizationId
    const { id, expenseId } = await params
    const body = await request.json()

    const shipment = await db.shipment.findFirst({ where: { id, organizationId: orgId } })
    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      )
    }

    const existing = await db.shipmentExpense.findFirst({ where: { id: expenseId, organizationId: orgId } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (body.expenseType !== undefined) updateData.expenseType = body.expenseType
    if (body.vendorId !== undefined) updateData.vendorId = body.vendorId || null
    if (body.quantity !== undefined) updateData.quantity = body.quantity
    if (body.unitPrice !== undefined) updateData.unitPrice = body.unitPrice
    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus
    if (body.invoiceNumber !== undefined) updateData.invoiceNumber = body.invoiceNumber || null
    if (body.notes !== undefined) updateData.notes = body.notes || null

    const expense = await db.shipmentExpense.update({
      where: { id: expenseId, organizationId: orgId },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: expense })
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update expense' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const orgId = session.user.organizationId
    const { id, expenseId } = await params

    const shipment = await db.shipment.findFirst({ where: { id, organizationId: orgId } })
    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      )
    }

    const existing = await db.shipmentExpense.findFirst({ where: { id: expenseId, organizationId: orgId } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      )
    }

    await db.shipmentExpense.delete({ where: { id: expenseId, organizationId: orgId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete expense' },
      { status: 500 }
    )
  }
}
