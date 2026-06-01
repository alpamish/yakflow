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

    const voyage = await db.voyage.findUnique({
      where: { id, organizationId: orgId },
      include: {
        teuRecords: { orderBy: { recordedAt: 'desc' } },
        revenues: true,
        expenses: {
          include: {
            vendor: { select: { id: true, name: true } },
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

    // Calculate totals
    const totalRevenue = voyage.revenues.reduce(
      (sum, r) => sum + (r.amount || 0),
      0
    )
    const totalExpense = voyage.expenses.reduce(
      (sum, e) => sum + (e.amount || 0),
      0
    )
    const netProfit = totalRevenue - totalExpense

    // Latest TEU data
    const latestTeu = voyage.teuRecords.length > 0 ? voyage.teuRecords[0] : null
    const totalTEUs = latestTeu?.totalTEUs || 0
    const loadedTEUs = latestTeu?.loadedTEUs || 0

    // Profit per TEU
    const profitPerTEU = loadedTEUs > 0 ? netProfit / loadedTEUs : 0
    const revenuePerTEU = loadedTEUs > 0 ? totalRevenue / loadedTEUs : 0
    const expensePerTEU = loadedTEUs > 0 ? totalExpense / loadedTEUs : 0

    // Expense breakdown by type
    const expenseByType: Record<string, number> = {}
    for (const e of voyage.expenses) {
      const type = e.expenseType
      expenseByType[type] = (expenseByType[type] || 0) + (e.amount || 0)
    }

    // Revenue breakdown by type
    const revenueByType: Record<string, number> = {}
    for (const r of voyage.revenues) {
      const type = r.revenueType
      revenueByType[type] = (revenueByType[type] || 0) + (r.amount || 0)
    }

    return NextResponse.json({
      success: true,
      data: {
        voyageId: id,
        voyageNumber: voyage.voyageNumber,
        vesselName: voyage.vesselName,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        profitMargin: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 10000) / 100 : 0,
        teuSummary: latestTeu
          ? {
              totalTEUs: latestTeu.totalTEUs,
              loadedTEUs: latestTeu.loadedTEUs,
              emptyTEUs: latestTeu.emptyTEUs,
              teuUtilization: latestTeu.teuUtilization,
            }
          : null,
        profitPerTEU: Math.round(profitPerTEU * 100) / 100,
        revenuePerTEU: Math.round(revenuePerTEU * 100) / 100,
        expensePerTEU: Math.round(expensePerTEU * 100) / 100,
        expenseByType,
        revenueByType,
      },
    })
  } catch (error) {
    console.error('Error calculating voyage profit:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to calculate profit' },
      { status: 500 }
    )
  }
}
