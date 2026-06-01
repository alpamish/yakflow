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
    const entityType = searchParams.get('entityType') || ''
    const documentType = searchParams.get('documentType') || ''
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { organizationId: orgId }

    if (entityType) {
      where.entityType = entityType
    }

    if (documentType) {
      where.documentType = documentType
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { documentType: { contains: search } },
      ]
    }

    const orderBy: Record<string, string> = {}
    orderBy[sortBy] = sortOrder

    const [documents, total] = await Promise.all([
      db.document.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      db.document.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error listing documents:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
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

    if (!body.entityType || !body.documentType || !body.name || !body.fileUrl) {
      return NextResponse.json(
        { success: false, error: 'entityType, documentType, name, and fileUrl are required' },
        { status: 400 }
      )
    }

    const document = await db.document.create({
      data: {
        entityType: body.entityType,
        entityId: body.entityId || null,
        documentType: body.documentType,
        name: body.name,
        fileUrl: body.fileUrl,
        fileSize: body.fileSize || null,
        mimeType: body.mimeType || null,
        version: body.version || 1,
        uploadedBy: body.uploadedBy || null,
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, data: document }, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create document' },
      { status: 500 }
    )
  }
}
