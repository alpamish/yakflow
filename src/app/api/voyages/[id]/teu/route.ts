import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const orgId = session.user.organizationId
    const { id } = await params

    const voyage = await db.voyage.findUnique({ where: { id, organizationId: orgId } })
    if (!voyage) {
      return NextResponse.json(
        { success: false, error: 'Voyage not found' },
        { status: 404 }
      )
    }

    const teuRecords = await db.voyageTEU.findMany({
      where: { voyageId: id, organizationId: orgId },
      orderBy: { recordedAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: teuRecords })
  } catch (error) {
    console.error('Error listing TEU records:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch TEU records' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const orgId = session.user.organizationId
    const { id } = await params
    const body = await request.json()

    const voyage = await db.voyage.findUnique({ where: { id, organizationId: orgId } })
    if (!voyage) {
      return NextResponse.json(
        { success: false, error: 'Voyage not found' },
        { status: 404 }
      )
    }

    const totalTEUs = body.totalTEUs || 0
    const loadedTEUs = body.loadedTEUs || 0
    const teuUtilization = totalTEUs > 0 ? (loadedTEUs / totalTEUs) * 100 : 0

    const teuRecord = await db.voyageTEU.create({
      data: {
        organizationId: orgId,
        voyageId: id,
        totalContainers: body.totalContainers || 0,
        totalTEUs,
        loadedTEUs,
        emptyTEUs: body.emptyTEUs || 0,
        twentyFoot: body.twentyFoot || 0,
        fortyFoot: body.fortyFoot || 0,
        fortyFiveFoot: body.fortyFiveFoot || 0,
        reeferUnits: body.reeferUnits || 0,
        specialUnits: body.specialUnits || 0,
        teuUtilization: Math.round(teuUtilization * 100) / 100,
        notes: body.notes || null,
        recordedAt: body.recordedAt ? new Date(body.recordedAt) : new Date(),
      },
    })

    return NextResponse.json({ success: true, data: teuRecord }, { status: 201 })
  } catch (error) {
    console.error('Error creating TEU record:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create TEU record' },
      { status: 500 }
    )
  }
}
