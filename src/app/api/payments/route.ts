import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const orgId = session.user.organizationId

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const invoiceId = searchParams.get('invoiceId') || ''
    const paymentMethod = searchParams.get('paymentMethod') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { organizationId: orgId }

    if (invoiceId) {
      where.invoiceId = invoiceId
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod
    }

    if (startDate || endDate) {
      where.paymentDate = {}
      if (startDate) {
        (where.paymentDate as Record<string, unknown>).gte = new Date(startDate)
      }
      if (endDate) {
        (where.paymentDate as Record<string, unknown>).lte = new Date(endDate)
      }
    }

    const orderBy: Record<string, string> = {}
    orderBy[sortBy] = sortOrder

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              type: true,
              status: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.payment.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error listing payments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const orgId = session.user.organizationId

    const body = await request.json()

    if (!body.invoiceId || body.amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'invoiceId and amount are required' },
        { status: 400 }
      )
    }

    const invoice = await db.invoice.findUnique({
      where: { id: body.invoiceId, organizationId: orgId },
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    const exchangeRate = body.exchangeRate || 1
    const amountBase = body.amount * exchangeRate

    const payment = await db.payment.create({
      data: {
        invoiceId: body.invoiceId,
        amount: body.amount,
        currency: body.currency || 'USD',
        exchangeRate,
        amountBase,
        paymentMethod: body.paymentMethod || null,
        reference: body.reference || null,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
        notes: body.notes || null,
        organizationId: orgId,
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            type: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: payment }, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}
