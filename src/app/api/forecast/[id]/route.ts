import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { unlink } from 'fs/promises'
import path from 'path'

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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const file = await db.forecastFile.findFirst({
      where: { id, organizationId: orgId },
    })

    if (!file) {
      return NextResponse.json({ success: false, error: 'Forecast file not found' }, { status: 404 })
    }

    const [rows, total] = await Promise.all([
      db.forecastRow.findMany({
        where: { forecastFileId: id },
        orderBy: { rowIndex: 'asc' },
        skip,
        take: limit,
      }),
      db.forecastRow.count({ where: { forecastFileId: id } }),
    ])

    const parsedRows = rows.map((r) => ({
      ...r,
      parsedData: JSON.parse(r.data) as Record<string, string>,
    }))

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: {
        file,
        rows: parsedRows,
        headers: JSON.parse(file.columnHeaders) as string[],
      },
      pagination: { page, limit, total, totalPages },
    })
  } catch (error) {
    console.error('Error fetching forecast file:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch forecast file' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const file = await db.forecastFile.findFirst({
      where: { id, organizationId: orgId },
    })

    if (!file) {
      return NextResponse.json({ success: false, error: 'Forecast file not found' }, { status: 404 })
    }

    // Delete the physical file from disk (ignore failure)
    const filePath = path.join(process.cwd(), 'public', file.filename)
    try { await unlink(filePath) } catch { /* non-critical */ }

    // Cascade deletes rows + change logs via Prisma
    await db.forecastFile.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting forecast file:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete forecast file' },
      { status: 500 }
    )
  }
}
