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

    const voyage = await db.voyage.findUnique({ where: { id, organizationId: orgId } })
    if (!voyage) {
      return NextResponse.json(
        { success: false, error: 'Voyage not found' },
        { status: 404 }
      )
    }

    const existing = await db.voyageExpense.findUnique({ where: { id: expenseId, organizationId: orgId } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (body.expenseType !== undefined) updateData.expenseType = body.expenseType
    if (body.vendorId !== undefined) updateData.vendorId = body.vendorId || null
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.quantity !== undefined) updateData.quantity = body.quantity
    if (body.unitPrice !== undefined) updateData.unitPrice = body.unitPrice
    if (body.weight !== undefined) updateData.weight = body.weight
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.invoiceNumber !== undefined) updateData.invoiceNumber = body.invoiceNumber || null
    if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus

    const expense = await db.voyageExpense.update({
      where: { id: expenseId, organizationId: orgId },
      data: updateData,
      include: {
        vendor: { select: { id: true, name: true, code: true } },
      },
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

    const voyage = await db.voyage.findUnique({ where: { id, organizationId: orgId } })
    if (!voyage) {
      return NextResponse.json(
        { success: false, error: 'Voyage not found' },
        { status: 404 }
      )
    }

    const existing = await db.voyageExpense.findUnique({ where: { id: expenseId, organizationId: orgId } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      )
    }

    await db.voyageExpense.delete({ where: { id: expenseId, organizationId: orgId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete expense' },
      { status: 500 }
    )
  }
}
