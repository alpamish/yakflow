import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const voyage = await db.voyage.findUnique({ where: { id } })
    if (!voyage) {
      return NextResponse.json(
        { success: false, error: 'Voyage not found' },
        { status: 404 }
      )
    }

    const expenses = await db.voyageExpense.findMany({
      where: { voyageId: id },
      include: {
        vendor: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: expenses })
  } catch (error) {
    console.error('Error listing voyage expenses:', error)
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

    const voyage = await db.voyage.findUnique({ where: { id } })
    if (!voyage) {
      return NextResponse.json(
        { success: false, error: 'Voyage not found' },
        { status: 404 }
      )
    }

    if (!body.expenseType || body.amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'expenseType and amount are required' },
        { status: 400 }
      )
    }

    const amount = body.amount

    const expense = await db.voyageExpense.create({
      data: {
        voyageId: id,
        expenseType: body.expenseType,
        vendorId: body.vendorId || null,
        currency: body.currency || 'USD',
        amount,
        quantity: body.quantity || 1,
        unitPrice: body.unitPrice || 0,
        weight: body.weight || null,
        description: body.description || null,
        invoiceNumber: body.invoiceNumber || null,
        paymentStatus: body.paymentStatus || 'pending',
        expenseDate: body.expenseDate ? new Date(body.expenseDate) : new Date(),
      },
      include: {
        vendor: { select: { id: true, name: true, code: true } },
      },
    })

    return NextResponse.json({ success: true, data: expense }, { status: 201 })
  } catch (error) {
    console.error('Error creating voyage expense:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}
