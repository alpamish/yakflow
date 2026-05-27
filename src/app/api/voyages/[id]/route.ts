import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const voyage = await db.voyage.findUnique({
      where: { id },
      include: {
        teuRecords: { orderBy: { recordedAt: 'desc' } },
        revenues: true,
        expenses: {
          include: {
            vendor: { select: { id: true, name: true, code: true } },
          },
        },
      },
    })

    if (!voyage) {
      return NextResponse.json(
        { success: false, error: 'Voyage not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: voyage })
  } catch (error) {
    console.error('Error fetching voyage:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch voyage' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.voyage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Voyage not found' },
        { status: 404 }
      )
    }

    const voyage = await db.voyage.update({
      where: { id },
      data: {
        vesselName: body.vesselName,
        sailingRoute: body.sailingRoute ?? null,
        departurePort: body.departurePort ?? null,
        arrivalPort: body.arrivalPort ?? null,
        etd: body.etd ? new Date(body.etd) : null,
        eta: body.eta ? new Date(body.eta) : null,
        shippingLine: body.shippingLine ?? null,
        status: body.status,
        remarks: body.remarks ?? null,
      },
    })

    return NextResponse.json({ success: true, data: voyage })
  } catch (error) {
    console.error('Error updating voyage:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update voyage' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.voyage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Voyage not found' },
        { status: 404 }
      )
    }

    await db.voyage.delete({ where: { id } })

    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    console.error('Error deleting voyage:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete voyage' },
      { status: 500 }
    )
  }
}
