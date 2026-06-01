import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const orgId = session.user.organizationId
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // Start of current month
    const monthStart = new Date(currentYear, currentMonth, 1)
    // Start of 6 months ago
    const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1)

    // === Shipment Statistics ===
    const [
      totalShipments,
      activeShipments,
      deliveredShipments,
      delayedShipments,
    ] = await Promise.all([
      db.shipment.count({ where: { organizationId: orgId } }),
      db.shipment.count({
        where: {
          organizationId: orgId,
          status: { in: ['booked', 'loading', 'in_transit', 'arrived', 'customs_clearance'] },
        },
      }),
      db.shipment.count({ where: { organizationId: orgId, status: 'delivered' } }),
      db.shipment.count({
        where: {
          organizationId: orgId,
          eta: { lt: now },
          status: { notIn: ['delivered', 'cancelled'] },
        },
      }),
    ])

    // === Voyage Statistics ===
    const [totalVoyages, activeVoyages] = await Promise.all([
      db.voyage.count({ where: { organizationId: orgId } }),
      db.voyage.count({
        where: {
          organizationId: orgId,
          status: { in: ['loading', 'departed', 'in_transit'] },
        },
      }),
    ])

    // === Monthly Revenue & Expenses (current month) ===
    const monthlyRevenues = await db.shipmentRevenue.findMany({
      where: { organizationId: orgId, createdAt: { gte: monthStart } },
      select: { amount: true },
    })
    const monthlyExpenses = await db.shipmentExpense.findMany({
      where: { organizationId: orgId, expenseDate: { gte: monthStart } },
      select: { amount: true },
    })

    const monthlyRevenueTotal = monthlyRevenues.reduce(
      (sum, r) => sum + (r.amount || 0),
      0
    )
    const monthlyExpenseTotal = monthlyExpenses.reduce(
      (sum, e) => sum + (e.amount || 0),
      0
    )
    const monthlyNetProfit = monthlyRevenueTotal - monthlyExpenseTotal

    // === Shipment Trends (last 6 months) ===
    const shipmentTrends = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentYear, currentMonth - i, 1)
      const monthEnd = new Date(currentYear, currentMonth - i + 1, 0)
      const monthLabel = monthDate.toLocaleString('default', {
        month: 'short',
        year: '2-digit',
      })

      const count = await db.shipment.count({
        where: {
          organizationId: orgId,
          createdAt: {
            gte: monthDate,
            lte: monthEnd,
          },
        },
      })

      shipmentTrends.push({ month: monthLabel, count })
    }

    // === Revenue Trends (last 6 months) ===
    const revenueTrends = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentYear, currentMonth - i, 1)
      const monthEnd = new Date(currentYear, currentMonth - i + 1, 0)
      const monthLabel = monthDate.toLocaleString('default', {
        month: 'short',
        year: '2-digit',
      })

      const monthRevenues = await db.shipmentRevenue.findMany({
        where: {
          organizationId: orgId,
          createdAt: { gte: monthDate, lte: monthEnd },
        },
        select: { amount: true },
      })

      const monthExpenses = await db.shipmentExpense.findMany({
        where: {
          organizationId: orgId,
          expenseDate: { gte: monthDate, lte: monthEnd },
        },
        select: { amount: true },
      })

      const rev = monthRevenues.reduce((sum, r) => sum + (r.amount || 0), 0)
      const exp = monthExpenses.reduce(
        (sum, e) => sum + (e.amount || 0),
        0
      )

      revenueTrends.push({
        month: monthLabel,
        revenue: Math.round(rev * 100) / 100,
        expense: Math.round(exp * 100) / 100,
        profit: Math.round((rev - exp) * 100) / 100,
      })
    }

    // === Expense Breakdown by Type ===
    const allExpenses = await db.shipmentExpense.findMany({
      where: {
        organizationId: orgId,
        expenseDate: { gte: sixMonthsAgo },
      },
      select: { expenseType: true, amount: true },
    })

    const expenseBreakdown: Record<string, number> = {}
    for (const e of allExpenses) {
      const type = e.expenseType
      expenseBreakdown[type] =
        (expenseBreakdown[type] || 0) + (e.amount || 0)
    }

    // Round breakdown values
    for (const key of Object.keys(expenseBreakdown)) {
      expenseBreakdown[key] = Math.round(expenseBreakdown[key] * 100) / 100
    }

    // === Country-wise Shipment Counts ===
    const shipments = await db.shipment.findMany({
      where: { organizationId: orgId },
      select: { originCountry: true, destinationCountry: true },
    })

    const countryCounts: Record<string, number> = {}
    for (const s of shipments) {
      if (s.originCountry) {
        countryCounts[s.originCountry] = (countryCounts[s.originCountry] || 0) + 1
      }
      if (s.destinationCountry) {
        countryCounts[s.destinationCountry] =
          (countryCounts[s.destinationCountry] || 0) + 1
      }
    }

    // === Top Customers by Revenue ===
    const topCustomersRaw = await db.shipmentRevenue.groupBy({
      by: ['customerId'],
      _sum: { amount: true },
      where: { customerId: { not: null }, organizationId: orgId },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    })

    const customerIds = topCustomersRaw
      .map((r) => r.customerId)
      .filter((id): id is string => id !== null)

    const customersData = await db.customer.findMany({
      where: { id: { in: customerIds }, organizationId: orgId },
      select: { id: true, name: true, code: true },
    })

    const topCustomers = topCustomersRaw.map((r) => {
      const customer = customersData.find((c) => c.id === r.customerId)
      return {
        customerId: r.customerId,
        customerName: customer?.name || 'Unknown',
        customerCode: customer?.code || '',
        totalRevenue: Math.round((r._sum.amount || 0) * 100) / 100,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        shipments: {
          total: totalShipments,
          active: activeShipments,
          delivered: deliveredShipments,
          delayed: delayedShipments,
        },
        voyages: {
          total: totalVoyages,
          active: activeVoyages,
        },
        monthly: {
          revenue: Math.round(monthlyRevenueTotal * 100) / 100,
          expenses: Math.round(monthlyExpenseTotal * 100) / 100,
          netProfit: Math.round(monthlyNetProfit * 100) / 100,
        },
        shipmentTrends,
        revenueTrends,
        expenseBreakdown,
        countryCounts,
        topCustomers,
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}
