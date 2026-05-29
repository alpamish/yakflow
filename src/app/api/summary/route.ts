import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // ============================================================
    // 1. Company Info
    // ============================================================
    const companyProfile = await db.companyProfile.findFirst()

    // ============================================================
    // 2. Shipment Summary
    // ============================================================
    const [
      totalShipments,
      shipmentsByStatus,
      shipmentsByDirection,
      shipmentsByTransportMode,
      totalContainers,
      shipmentRevenueAgg,
      shipmentExpenseAgg,
      allShipments,
    ] = await Promise.all([
      db.shipment.count(),
      db.shipment.groupBy({ by: ['status'], _count: { status: true } }),
      db.shipment.groupBy({ by: ['direction'], _count: { direction: true } }),
      db.shipment.groupBy({ by: ['transportMode'], _count: { transportMode: true } }),
      db.container.count(),
      db.shipmentRevenue.aggregate({ _sum: { amountBase: true } }),
      db.shipmentExpense.aggregate({ _sum: { amountBase: true, taxBase: true } }),
      db.shipment.findMany({ select: { id: true, createdAt: true } }),
    ])

    const shipmentStatusBreakdown: Record<string, number> = {}
    for (const row of shipmentsByStatus) {
      shipmentStatusBreakdown[row.status] = row._count.status
    }

    const shipmentDirectionBreakdown: Record<string, number> = {}
    for (const row of shipmentsByDirection) {
      shipmentDirectionBreakdown[row.direction] = row._count.direction
    }

    const shipmentTransportModeBreakdown: Record<string, number> = {}
    for (const row of shipmentsByTransportMode) {
      shipmentTransportModeBreakdown[row.transportMode] = row._count.transportMode
    }

    const totalShipmentRevenue = Math.round(shipmentRevenueAgg._sum.amountBase ?? 0)
    const totalShipmentExpense = Math.round(
      (shipmentExpenseAgg._sum.amountBase ?? 0) + (shipmentExpenseAgg._sum.taxBase ?? 0)
    )

    // ============================================================
    // 3. Voyage Summary
    // ============================================================
    const [
      totalVoyages,
      voyagesByStatus,
      latestVoyageTEUs,
      voyageRevenueAgg,
      voyageExpenseAgg,
    ] = await Promise.all([
      db.voyage.count(),
      db.voyage.groupBy({ by: ['status'], _count: { status: true } }),
      db.voyageTEU.findMany({
        distinct: ['voyageId'],
        orderBy: { recordedAt: 'desc' },
      }),
      db.voyageRevenue.aggregate({ _sum: { amount: true } }),
      db.voyageExpense.aggregate({ _sum: { amount: true } }),
    ])

    const voyageStatusBreakdown: Record<string, number> = {}
    for (const row of voyagesByStatus) {
      voyageStatusBreakdown[row.status] = row._count.status
    }

    const totalTEUs = latestVoyageTEUs.reduce((sum, t) => sum + (t.totalTEUs ?? 0), 0)
    const totalLoadedTEUs = latestVoyageTEUs.reduce((sum, t) => sum + (t.loadedTEUs ?? 0), 0)
    const avgUtilization =
      totalTEUs > 0 ? Math.round((totalLoadedTEUs / totalTEUs) * 10000) / 100 : 0

    const totalVoyageRevenue = Math.round(voyageRevenueAgg._sum.amount ?? 0)
    const totalVoyageExpense = Math.round(voyageExpenseAgg._sum.amount ?? 0)

    // ============================================================
    // 4. Customer Summary
    // ============================================================
    const [totalCustomers, activeCustomers, revenueByCustomer] = await Promise.all([
      db.customer.count(),
      db.customer.count({ where: { isActive: true } }),
      db.shipmentRevenue.groupBy({
        by: ['customerId'],
        _sum: { amountBase: true },
        where: { customerId: { not: null } },
        orderBy: { _sum: { amountBase: 'desc' } },
        take: 5,
      }),
    ])

    const topCustomerIds = revenueByCustomer
      .map((r) => r.customerId)
      .filter((id): id is string => id !== null)

    const topCustomers = await db.customer.findMany({
      where: { id: { in: topCustomerIds } },
      select: { id: true, name: true },
    })

    const customerMap = new Map(topCustomers.map((c) => [c.id, c.name]))

    const top5CustomersByRevenue = revenueByCustomer.map((r) => ({
      customerId: r.customerId,
      customerName: customerMap.get(r.customerId!) ?? 'Unknown',
      totalRevenue: Math.round(r._sum.amountBase ?? 0),
    }))

    // ============================================================
    // 5. Vendor Summary
    // ============================================================
    const [totalVendors, activeVendors, expenseByVendor] = await Promise.all([
      db.vendor.count(),
      db.vendor.count({ where: { isActive: true } }),
      db.shipmentExpense.groupBy({
        by: ['vendorId'],
        _sum: { amountBase: true },
        where: { vendorId: { not: null } },
        orderBy: { _sum: { amountBase: 'desc' } },
        take: 5,
      }),
    ])

    const topVendorIds = expenseByVendor
      .map((r) => r.vendorId)
      .filter((id): id is string => id !== null)

    const topVendors = await db.vendor.findMany({
      where: { id: { in: topVendorIds } },
      select: { id: true, name: true },
    })

    const vendorMap = new Map(topVendors.map((v) => [v.id, v.name]))

    const top5VendorsByExpense = expenseByVendor.map((r) => ({
      vendorId: r.vendorId,
      vendorName: vendorMap.get(r.vendorId!) ?? 'Unknown',
      totalExpense: Math.round(r._sum.amountBase ?? 0),
    }))

    // ============================================================
    // 6. Financial Summary
    // ============================================================
    const [
      totalInvoices,
      invoicesByStatus,
      invoiceAgg,
      totalPayments,
      paymentsByStatus,
      paymentAmountAgg,
      arInvoices,
      apInvoices,
      invoicesByCurrency,
    ] = await Promise.all([
      db.invoice.count(),
      db.invoice.groupBy({
        by: ['status'],
        _count: { status: true },
        _sum: { totalAmount: true },
      }),
      db.invoice.aggregate({
        _sum: { subtotal: true, taxAmount: true, totalAmount: true },
      }),
      db.payment.count(),
      db.payment.groupBy({
        by: ['paymentMethod'],
        _count: true,
        _sum: { amountBase: true },
      }),
      db.payment.aggregate({ _sum: { amountBase: true } }),
      db.invoice.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ['sent', 'overdue'] }, type: 'receivable' },
      }),
      db.invoice.aggregate({
        _sum: { totalAmount: true },
        where: { type: 'payable', status: { notIn: ['paid', 'cancelled'] } },
      }),
      db.invoice.groupBy({
        by: ['currency'],
        _count: true,
        _sum: { totalAmount: true, totalBase: true },
      }),
    ])

    const invoiceStatusBreakdown: Record<string, { count: number; totalAmount: number }> = {}
    for (const row of invoicesByStatus) {
      invoiceStatusBreakdown[row.status] = {
        count: row._count.status,
        totalAmount: Math.round(row._sum.totalAmount ?? 0),
      }
    }

    const paymentStatusBreakdown: Record<string, { count: number; totalAmount: number }> = {}
    for (const row of paymentsByStatus) {
      const method = row.paymentMethod ?? 'unknown'
      paymentStatusBreakdown[method] = {
        count: row._count,
        totalAmount: Math.round(row._sum.amountBase ?? 0),
      }
    }

    const currencyBreakdown: Record<
      string,
      { count: number; totalAmount: number; totalBase: number }
    > = {}
    for (const row of invoicesByCurrency) {
      currencyBreakdown[row.currency] = {
        count: row._count,
        totalAmount: Math.round(row._sum.totalAmount ?? 0),
        totalBase: Math.round(row._sum.totalBase ?? 0),
      }
    }

    // ============================================================
    // 7. Container Summary
    // ============================================================
    const [containersByType, containersByStatus, containerAgg] = await Promise.all([
      db.container.groupBy({
        by: ['containerSize'],
        _count: { containerSize: true },
      }),
      db.container.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      db.container.aggregate({
        _count: true,
      }),
    ])

    const containerTypeBreakdown: Record<string, number> = {}
    for (const row of containersByType) {
      const size = row.containerSize ?? 'unknown'
      containerTypeBreakdown[size] = row._count.containerSize
    }

    const containerStatusBreakdown: Record<string, number> = {}
    for (const row of containersByStatus) {
      containerStatusBreakdown[row.status] = row._count.status
    }

    // Reefer and special units from latest VoyageTEU records
    const reeferCount = latestVoyageTEUs.reduce((sum, t) => sum + (t.reeferUnits ?? 0), 0)
    const specialUnitsCount = latestVoyageTEUs.reduce(
      (sum, t) => sum + (t.specialUnits ?? 0),
      0
    )

    // ============================================================
    // 8. Expense Breakdown (Shipment + Voyage)
    // ============================================================
    const [shipmentExpenseByType, voyageExpenseByType] = await Promise.all([
      db.shipmentExpense.groupBy({
        by: ['expenseType'],
        _sum: { amountBase: true, taxBase: true },
      }),
      db.voyageExpense.groupBy({
        by: ['expenseType'],
        _sum: { amount: true },
      }),
    ])

    const expenseBreakdownMap: Record<string, number> = {}

    for (const row of shipmentExpenseByType) {
      const total = (row._sum.amountBase ?? 0) + (row._sum.taxBase ?? 0)
      expenseBreakdownMap[row.expenseType] =
        (expenseBreakdownMap[row.expenseType] ?? 0) + Math.round(total)
    }

    for (const row of voyageExpenseByType) {
      expenseBreakdownMap[row.expenseType] =
        (expenseBreakdownMap[row.expenseType] ?? 0) + Math.round(row._sum.amount ?? 0)
    }

    const expenseBreakdown = Object.entries(expenseBreakdownMap)
      .map(([type, total]) => ({ type, total }))
      .sort((a, b) => b.total - a.total)

    // ============================================================
    // 9. Revenue Breakdown (Shipment + Voyage)
    // ============================================================
    const [shipmentRevenueByType, voyageRevenueByType] = await Promise.all([
      db.shipmentRevenue.groupBy({
        by: ['revenueType'],
        _sum: { amountBase: true },
      }),
      db.voyageRevenue.groupBy({
        by: ['revenueType'],
        _sum: { amount: true },
      }),
    ])

    const revenueBreakdownMap: Record<string, number> = {}

    for (const row of shipmentRevenueByType) {
      revenueBreakdownMap[row.revenueType] =
        (revenueBreakdownMap[row.revenueType] ?? 0) + Math.round(row._sum.amountBase ?? 0)
    }

    for (const row of voyageRevenueByType) {
      revenueBreakdownMap[row.revenueType] =
        (revenueBreakdownMap[row.revenueType] ?? 0) + Math.round(row._sum.amount ?? 0)
    }

    const revenueBreakdown = Object.entries(revenueBreakdownMap)
      .map(([type, total]) => ({ type, total }))
      .sort((a, b) => b.total - a.total)

    // ============================================================
    // 10. Monthly Trends (last 6 months)
    // ============================================================
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const [monthlyShipments, monthlyShipmentRevenues, monthlyShipmentExpenses] =
      await Promise.all([
        db.shipment.findMany({
          where: { createdAt: { gte: sixMonthsAgo } },
          select: { createdAt: true },
        }),
        db.shipmentRevenue.findMany({
          where: { createdAt: { gte: sixMonthsAgo } },
          select: { amountBase: true, createdAt: true },
        }),
        db.shipmentExpense.findMany({
          where: { expenseDate: { gte: sixMonthsAgo } },
          select: { amountBase: true, taxBase: true, expenseDate: true },
        }),
      ])

    // Build month key helper
    const monthKey = (date: Date) => {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      return `${y}-${m}`
    }

    // Initialize last 6 months
    const monthlyTrends: Array<{
      month: string
      shipmentCount: number
      revenue: number
      expenses: number
    }> = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthlyTrends.push({
        month: monthKey(d),
        shipmentCount: 0,
        revenue: 0,
        expenses: 0,
      })
    }

    const trendMap = new Map(monthlyTrends.map((t) => [t.month, t]))

    for (const s of monthlyShipments) {
      const key = monthKey(s.createdAt)
      const entry = trendMap.get(key)
      if (entry) entry.shipmentCount++
    }

    for (const r of monthlyShipmentRevenues) {
      const key = monthKey(r.createdAt)
      const entry = trendMap.get(key)
      if (entry) entry.revenue += r.amountBase ?? 0
    }

    for (const e of monthlyShipmentExpenses) {
      const key = monthKey(e.expenseDate)
      const entry = trendMap.get(key)
      if (entry) entry.expenses += (e.amountBase ?? 0) + (e.taxBase ?? 0)
    }

    // Round final monthly values
    for (const t of monthlyTrends) {
      t.revenue = Math.round(t.revenue)
      t.expenses = Math.round(t.expenses)
    }

    // ============================================================
    // Build response
    // ============================================================
    const data = {
      companyInfo: {
        name: companyProfile?.name ?? '',
        baseCurrency: companyProfile?.baseCurrency ?? 'USD',
      },

      shipmentSummary: {
        totalShipments,
        byStatus: shipmentStatusBreakdown,
        byDirection: shipmentDirectionBreakdown,
        byTransportMode: shipmentTransportModeBreakdown,
        totalContainers,
        totalRevenue: totalShipmentRevenue,
        totalExpenses: totalShipmentExpense,
        netProfit: totalShipmentRevenue - totalShipmentExpense,
      },

      voyageSummary: {
        totalVoyages,
        byStatus: voyageStatusBreakdown,
        totalTEUs,
        avgUtilization,
        totalRevenue: totalVoyageRevenue,
        totalExpenses: totalVoyageExpense,
        netProfit: totalVoyageRevenue - totalVoyageExpense,
      },

      customerSummary: {
        totalCustomers,
        activeCustomers,
        top5ByRevenue: top5CustomersByRevenue,
      },

      vendorSummary: {
        totalVendors,
        activeVendors,
        top5ByExpense: top5VendorsByExpense,
      },

      financialSummary: {
        totalInvoices,
        byStatus: invoiceStatusBreakdown,
        totalSubtotal: Math.round(invoiceAgg._sum.subtotal ?? 0),
        totalTax: Math.round(invoiceAgg._sum.taxAmount ?? 0),
        totalInvoiceAmount: Math.round(invoiceAgg._sum.totalAmount ?? 0),
        totalPayments,
        byPaymentMethod: paymentStatusBreakdown,
        totalPaymentAmount: Math.round(paymentAmountAgg._sum.amountBase ?? 0),
        accountsReceivable: Math.round(arInvoices._sum.totalAmount ?? 0),
        accountsPayable: Math.round(apInvoices._sum.totalAmount ?? 0),
        byCurrency: currencyBreakdown,
      },

      containerSummary: {
        totalContainers: containerAgg._count,
        byType: containerTypeBreakdown,
        byStatus: containerStatusBreakdown,
        reeferCount,
        specialUnitsCount,
      },

      expenseBreakdown,
      revenueBreakdown,
      monthlyTrends,
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[Summary API Error]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}
