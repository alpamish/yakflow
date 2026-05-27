import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const shipment = await db.shipment.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
        containers: true,
        expenses: {
          include: {
            vendor: { select: { id: true, name: true } },
          },
        },
        revenues: {
          include: {
            customer: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Calculate totals
    const grossRevenue = shipment.revenues.reduce(
      (sum, r) => sum + (r.amountBase || 0),
      0
    )
    const totalExpense = shipment.expenses.reduce(
      (sum, e) => sum + (e.amountBase || 0) + (e.taxBase || 0),
      0
    )
    const netProfit = grossRevenue - totalExpense
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0

    // Profit by container
    const profitByContainer = shipment.containers.map((container) => {
      // For simplicity, distribute revenue/expense evenly across containers
      const containerCount = shipment.containers.length || 1
      const containerRevenue = grossRevenue / containerCount
      const containerExpense = totalExpense / containerCount
      return {
        containerId: container.id,
        containerNumber: container.containerNumber,
        containerType: container.containerType,
        revenue: Math.round(containerRevenue * 100) / 100,
        expense: Math.round(containerExpense * 100) / 100,
        profit: Math.round((containerRevenue - containerExpense) * 100) / 100,
      }
    })

    // Profit by customer
    const customerMap = new Map<
      string,
      { name: string; revenue: number; expense: number }
    >()
    for (const r of shipment.revenues) {
      const key = r.customerId || 'unknown'
      const existing = customerMap.get(key) || {
        name: r.customer?.name || 'Unknown',
        revenue: 0,
        expense: 0,
      }
      existing.revenue += r.amountBase || 0
      customerMap.set(key, existing)
    }
    for (const e of shipment.expenses) {
      const key = e.vendorId || 'unknown'
      // Expenses are by vendor, not customer - skip for profit by customer
    }
    const profitByCustomer = Array.from(customerMap.entries()).map(
      ([id, data]) => ({
        customerId: id,
        customerName: data.name,
        revenue: Math.round(data.revenue * 100) / 100,
        expense: Math.round(data.expense * 100) / 100,
        profit: Math.round((data.revenue - data.expense) * 100) / 100,
      })
    )

    // Profit by route
    const route = `${shipment.portOfLoading || 'N/A'} → ${shipment.portOfDischarge || 'N/A'}`
    const profitByRoute = [
      {
        route,
        originCountry: shipment.originCountry,
        destinationCountry: shipment.destinationCountry,
        revenue: Math.round(grossRevenue * 100) / 100,
        expense: Math.round(totalExpense * 100) / 100,
        profit: Math.round(netProfit * 100) / 100,
      },
    ]

    // Expense breakdown by type
    const expenseByType: Record<string, number> = {}
    for (const e of shipment.expenses) {
      const type = e.expenseType
      expenseByType[type] = (expenseByType[type] || 0) + (e.amountBase || 0) + (e.taxBase || 0)
    }

    return NextResponse.json({
      success: true,
      data: {
        shipmentId: id,
        shipmentNumber: shipment.shipmentNumber,
        grossRevenue: Math.round(grossRevenue * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
        profitByContainer,
        profitByCustomer,
        profitByRoute,
        expenseByType,
      },
    })
  } catch (error) {
    console.error('Error calculating shipment profit:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to calculate profit' },
      { status: 500 }
    )
  }
}
