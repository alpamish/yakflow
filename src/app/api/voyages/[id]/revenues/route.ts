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

    const revenues = await db.voyageRevenue.findMany({
      where: { voyageId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: revenues })
  } catch (error) {
    console.error('Error listing voyage revenues:', error)
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

    const voyage = await db.voyage.findUnique({ where: { id } })
    if (!voyage) {
      return NextResponse.json(
        { success: false, error: 'Voyage not found' },
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
    const amountBase = amount * exchangeRate

    const revenue = await db.voyageRevenue.create({
      data: {
        voyageId: id,
        revenueType: body.revenueType,
        currency: body.currency || 'USD',
        exchangeRate,
        amount,
        amountBase,
        description: body.description || null,
        invoiceNumber: body.invoiceNumber || null,
        paymentStatus: body.paymentStatus || 'pending',
        revenueDate: body.revenueDate ? new Date(body.revenueDate) : new Date(),
      },
    })

    return NextResponse.json({ success: true, data: revenue }, { status: 201 })
  } catch (error) {
    console.error('Error creating voyage revenue:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create revenue' },
      { status: 500 }
    )
  }
}
