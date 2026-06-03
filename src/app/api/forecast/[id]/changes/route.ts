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

    const file = await db.forecastFile.findFirst({
      where: { id, organizationId: orgId },
    })

    if (!file) {
      return NextResponse.json({ success: false, error: 'Forecast file not found' }, { status: 404 })
    }

    const changes = await db.forecastChangeLog.findMany({
      where: { forecastFileId: id },
      orderBy: [{ rowIndex: 'asc' }, { field: 'asc' }],
    })

    const summary = file.changeSummary ? JSON.parse(file.changeSummary) : null

    return NextResponse.json({
      success: true,
      data: {
        changes,
        summary,
        version: file.version,
        comparedToVersion: file.version > 1 ? file.version - 1 : null,
      },
    })
  } catch (error) {
    console.error('Error fetching forecast changes:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch changes' },
      { status: 500 }
    )
  }
}
