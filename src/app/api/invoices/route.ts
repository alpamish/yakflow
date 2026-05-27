import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { notes: { contains: search } },
      ]
    }

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate)
      }
      if (endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(endDate)
      }
    }

    const orderBy: Record<string, string> = {}
    orderBy[sortBy] = sortOrder

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          payments: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.invoice.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error listing invoices:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.invoiceNumber || !body.type || !body.entityType || body.totalAmount === undefined) {
      return NextResponse.json(
        { success: false, error: 'invoiceNumber, type, entityType, and totalAmount are required' },
        { status: 400 }
      )
    }

    const exchangeRate = body.exchangeRate || 1
    const totalBase = body.totalAmount * exchangeRate

    const invoice = await db.invoice.create({
      data: {
        invoiceNumber: body.invoiceNumber,
        type: body.type,
        entityType: body.entityType,
        entityId: body.entityId || null,
        customerId: body.customerId || null,
        vendorId: body.vendorId || null,
        currency: body.currency || 'USD',
        exchangeRate,
        subtotal: body.subtotal || body.totalAmount,
        taxAmount: body.taxAmount || 0,
        totalAmount: body.totalAmount,
        totalBase,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: body.status || 'draft',
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ success: true, data: invoice }, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
