import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { parseExcel, detectChanges } from '@/lib/forecast-parser'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const ALLOWED_EXTENSIONS = ['.xlsx', '.xls']
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'forecast')

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
    const skip = (page - 1) * limit

    const where = { organizationId: orgId }

    const [files, total] = await Promise.all([
      db.forecastFile.findMany({
        where,
        orderBy: { version: 'desc' },
        skip,
        take: limit,
      }),
      db.forecastFile.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: files,
      pagination: { page, limit, total, totalPages },
    })
  } catch (error) {
    console.error('Error listing forecast files:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch forecast files' },
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
    const userName = session.user.name

    const formData = await request.formData()
    const fileField = formData.get('file')

    if (!fileField || !(fileField instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'No file provided. Send a FormData with field "file".' },
        { status: 400 }
      )
    }

    const file = fileField as File
    const originalName = file.name
    const ext = path.extname(originalName).toLowerCase()

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type "${ext}". Only .xlsx and .xls are allowed.` },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const parsed = parseExcel(arrayBuffer)

    if (parsed.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'The Excel file contains no data rows.' },
        { status: 400 }
      )
    }

    await mkdir(UPLOAD_DIR, { recursive: true })

    const serverFilename = `${crypto.randomUUID()}${ext}`
    const filePath = path.join(UPLOAD_DIR, serverFilename)
    const buffer = Buffer.from(arrayBuffer)
    await writeFile(filePath, buffer)

    const latestFile = await db.forecastFile.findFirst({
      where: { organizationId: orgId },
      orderBy: { version: 'desc' },
    })
    const newVersion = (latestFile?.version ?? 0) + 1

    let changes: Awaited<ReturnType<typeof detectChanges>>['changes'] = []
    let summary: Awaited<ReturnType<typeof detectChanges>>['summary'] = { updates: 0, newRows: 0, removedRows: 0 }

    if (latestFile) {
      const prevRows = await db.forecastRow.findMany({
        where: { forecastFileId: latestFile.id },
      })

      const prevParsedRows = prevRows.map((r) => ({
        rowIndex: r.rowIndex,
        voyageNumber: r.voyageNumber,
        containerNumber: r.containerNumber,
        shipmentId: r.shipmentId,
        bookingRef: r.bookingRef,
        data: JSON.parse(r.data) as Record<string, string>,
      }))

      const result = detectChanges(parsed.rows, prevParsedRows)
      changes = result.changes
      summary = result.summary
    }

    // Validate FK fields before creating
    if (!orgId || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Invalid session data: missing organization or user ID.' },
        { status: 400 }
      )
    }

    const orgExists = await db.organization.findUnique({ where: { id: orgId }, select: { id: true } })
    if (!orgExists) {
      return NextResponse.json(
        { success: false, error: 'Organization not found for this session.' },
        { status: 400 }
      )
    }

    const userExists = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true } })
    if (!userExists) {
      return NextResponse.json(
        { success: false, error: 'User not found for this session.' },
        { status: 400 }
      )
    }

    const fileRecord = await db.forecastFile.create({
      data: {
        organizationId: orgId,
        version: newVersion,
        originalName,
        filename: `uploads/forecast/${serverFilename}`,
        uploadedBy: userName,
        uploadedById: session.user.id,
        fileSize: buffer.length,
        rowCount: parsed.rows.length,
        columnHeaders: JSON.stringify(parsed.headers),
        changeSummary: JSON.stringify(summary),
      },
    })

    const rowData = parsed.rows.map((r) => ({
      forecastFileId: fileRecord.id,
      rowIndex: r.rowIndex,
      voyageNumber: r.voyageNumber,
      containerNumber: r.containerNumber,
      shipmentId: r.shipmentId,
      bookingRef: r.bookingRef,
      data: JSON.stringify(r.data),
    }))
    await db.forecastRow.createMany({ data: rowData })

    if (changes.length > 0) {
      const changeLogData = changes.map((c) => ({
        forecastFileId: fileRecord.id,
        comparedToVersion: newVersion - 1,
        changeType: c.changeType,
        field: c.field,
        oldValue: c.oldValue,
        newValue: c.newValue,
        voyageNumber: c.voyageNumber,
        containerNumber: c.containerNumber,
        shipmentId: c.shipmentId,
        bookingRef: c.bookingRef,
        rowIndex: c.rowIndex,
        uploadedBy: userName,
        uploadedById: session.user.id,
      }))
      await db.forecastChangeLog.createMany({ data: changeLogData })
    }

    try {
      await db.notification.create({
        data: {
          organizationId: orgId,
          userId: session.user.id,
          title: 'Forecast Updated',
          message: `Forecast v${newVersion} uploaded by ${userName}. ${summary.updates} values changed, ${summary.newRows} new, ${summary.removedRows} removed.`,
          type: 'info',
        },
      })
    } catch {
      // non-critical
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          file: fileRecord,
          changes,
          summary,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error uploading forecast:', error)
    const message =
      error && typeof error === 'object' && 'code' in error && (error as any).code === 'P2003'
        ? `Foreign key constraint failed. ${JSON.stringify((error as any).meta)}`
        : 'Failed to upload forecast file'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
