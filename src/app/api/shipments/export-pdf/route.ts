import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const statusLabels: Record<string, string> = {
  draft: 'Draft', booked: 'Booked', loading: 'Loading', in_transit: 'In Transit',
  arrived: 'Arrived', customs_clearance: 'Customs Clearance', delivered: 'Delivered', cancelled: 'Cancelled',
}

const expenseTypeLabels: Record<string, string> = {
  ocean_freight: 'Ocean Freight', dthc: 'DTHC', othc: 'OTHC', railways: 'Railways',
  x_ray: 'X-Ray', inspection: 'Inspection', customs: 'Customs', fuel: 'Fuel',
  toll: 'Toll', driver_expense: 'Driver Expense', port_charges: 'Port Charges',
  handling_charges: 'Handling Charges', warehouse_charges: 'Warehouse Charges',
  documentation: 'Documentation', agency_charges: 'Agency Charges', miscellaneous: 'Miscellaneous',
}

const revenueTypeLabels: Record<string, string> = {
  freight_charges: 'Freight Charges', delivery_charges: 'Delivery Charges',
  customs_charges: 'Customs Charges', documentation_fees: 'Documentation Fees',
  handling_fees: 'Handling Fees', storage_charges: 'Storage Charges', other_charges: 'Other Charges',
}

const fmt = (n: number) => Math.round((n || 0) * 100) / 100
const fmtCurrency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
const fmtDate = (d: Date | null) => d ? new Date(d).toLocaleDateString('en-US') : ''

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildReportData(shipments: Awaited<ReturnType<typeof db.shipment.findMany>>, reportType: string) {
  switch (reportType) {
    case 'shipment_summary':
      return shipments.map(s => {
        const totalRev = s.revenues.reduce((sum: number, r: { amountBase: number | null }) => sum + (r.amountBase || 0), 0)
        const totalExp = s.expenses.reduce((sum: number, e: { amountBase: number | null; taxBase: number | null }) => sum + (e.amountBase || 0) + (e.taxBase || 0), 0)
        return [s.shipmentNumber, s.direction.toUpperCase(), s.transportMode.toUpperCase(), s.customer?.name || '', `${s.originCountry || ''} → ${s.destinationCountry || ''}`, statusLabels[s.status] || s.status, String(s.containers.length), fmtCurrency(totalRev), fmtCurrency(totalExp), fmtCurrency(totalRev - totalExp)]
      })

    case 'profitability':
      return shipments.map(s => {
        const totalRev = s.revenues.reduce((sum: number, r: { amountBase: number | null }) => sum + (r.amountBase || 0), 0)
        const totalExp = s.expenses.reduce((sum: number, e: { amountBase: number | null; taxBase: number | null }) => sum + (e.amountBase || 0) + (e.taxBase || 0), 0)
        const profit = totalRev - totalExp
        const margin = totalRev > 0 ? (profit / totalRev * 100).toFixed(1) : '0.0'
        return [s.shipmentNumber, s.customer?.name || '', `${s.originCountry || ''} → ${s.destinationCountry || ''}`, fmtCurrency(totalRev), fmtCurrency(totalExp), fmtCurrency(profit), margin + '%']
      })

    case 'customer_ledger': {
      const map: Record<string, { name: string; shipments: number; revenue: number; expenses: number }> = {}
      for (const s of shipments) {
        const key = (s.customer as { name: string } | null)?.name || 'Unknown'
        const totalRev = s.revenues.reduce((sum: number, r: { amountBase: number | null }) => sum + (r.amountBase || 0), 0)
        const totalExp = s.expenses.reduce((sum: number, e: { amountBase: number | null; taxBase: number | null }) => sum + (e.amountBase || 0) + (e.taxBase || 0), 0)
        if (!map[key]) map[key] = { name: key, shipments: 0, revenue: 0, expenses: 0 }
        map[key].shipments++
        map[key].revenue += totalRev
        map[key].expenses += totalExp
      }
      return Object.values(map).sort((a, b) => b.revenue - a.revenue).map(c => [c.name, String(c.shipments), fmtCurrency(c.revenue), fmtCurrency(c.expenses), fmtCurrency(c.revenue - c.expenses)])
    }

    case 'vendor_ledger': {
      const map: Record<string, { name: string; count: number; expenses: number }> = {}
      for (const s of shipments) {
        for (const e of s.expenses as Array<{ vendor: { name: string } | null; amountBase: number | null; taxBase: number | null }>) {
          const key = e.vendor?.name || 'Unknown'
          if (!map[key]) map[key] = { name: key, count: 0, expenses: 0 }
          map[key].expenses += (e.amountBase || 0) + (e.taxBase || 0)
          map[key].count++
        }
      }
      return Object.values(map).sort((a, b) => b.expenses - a.expenses).map(v => [v.name, String(v.count), fmtCurrency(v.expenses)])
    }

    case 'expense_report': {
      const rows: string[][] = []
      for (const s of shipments) {
        for (const e of s.expenses as Array<{ expenseType: string; vendor: { name: string } | null; currency: string; amount: number; amountBase: number | null; taxBase: number | null; paymentStatus: string; expenseDate: Date }>) {
          rows.push([s.shipmentNumber, expenseTypeLabels[e.expenseType] || e.expenseType, e.vendor?.name || '', e.currency, fmt(e.amount).toString(), fmt(e.amountBase || 0).toString(), fmt(e.taxBase || 0).toString(), e.paymentStatus, fmtDate(e.expenseDate)])
        }
      }
      return rows
    }

    case 'revenue_report': {
      const rows: string[][] = []
      for (const s of shipments) {
        for (const r of s.revenues as Array<{ revenueType: string; customer: { name: string } | null; currency: string; amount: number; amountBase: number | null; paymentStatus: string; dueDate: Date | null }>) {
          rows.push([s.shipmentNumber, revenueTypeLabels[r.revenueType] || r.revenueType, r.customer?.name || '', r.currency, fmt(r.amount).toString(), fmt(r.amountBase || 0).toString(), r.paymentStatus, fmtDate(r.dueDate)])
        }
      }
      return rows
    }

    case 'route_profitability': {
      const map: Record<string, { route: string; shipments: number; revenue: number; expenses: number }> = {}
      for (const s of shipments) {
        const route = `${s.originCountry || '—'} → ${s.destinationCountry || '—'}`
        const totalRev = s.revenues.reduce((sum: number, r: { amountBase: number | null }) => sum + (r.amountBase || 0), 0)
        const totalExp = s.expenses.reduce((sum: number, e: { amountBase: number | null; taxBase: number | null }) => sum + (e.amountBase || 0) + (e.taxBase || 0), 0)
        if (!map[route]) map[route] = { route, shipments: 0, revenue: 0, expenses: 0 }
        map[route].shipments++
        map[route].revenue += totalRev
        map[route].expenses += totalExp
      }
      return Object.values(map).sort((a, b) => (b.revenue - b.expenses) - (a.revenue - a.expenses)).map(r => [r.route, String(r.shipments), fmtCurrency(r.revenue), fmtCurrency(r.expenses), fmtCurrency(r.revenue - r.expenses)])
    }

    case 'country_analysis': {
      const map: Record<string, { country: string; asOrigin: number; asDestination: number; revenue: number }> = {}
      for (const s of shipments) {
        const totalRev = s.revenues.reduce((sum: number, r: { amountBase: number | null }) => sum + (r.amountBase || 0), 0)
        if (s.originCountry) {
          if (!map[s.originCountry]) map[s.originCountry] = { country: s.originCountry, asOrigin: 0, asDestination: 0, revenue: 0 }
          map[s.originCountry].asOrigin++
          map[s.originCountry].revenue += totalRev
        }
        if (s.destinationCountry) {
          if (!map[s.destinationCountry]) map[s.destinationCountry] = { country: s.destinationCountry, asOrigin: 0, asDestination: 0, revenue: 0 }
          map[s.destinationCountry].asDestination++
          map[s.destinationCountry].revenue += totalRev
        }
      }
      return Object.values(map).sort((a, b) => b.revenue - a.revenue).map(c => [c.country, String(c.asOrigin), String(c.asDestination), fmtCurrency(c.revenue)])
    }

    case 'container_utilization':
      return shipments.map(s => {
        const totalRev = s.revenues.reduce((sum: number, r: { amountBase: number | null }) => sum + (r.amountBase || 0), 0)
        const cnt = s.containers.length
        return [s.shipmentNumber, s.customer?.name || '', String(cnt), `${s.originCountry || ''} → ${s.destinationCountry || ''}`, statusLabels[s.status] || s.status, cnt > 0 ? fmtCurrency(totalRev / cnt) : '—']
      })

    default:
      return shipments.map(s => [s.shipmentNumber, s.customer?.name || '', `${s.originCountry || ''} → ${s.destinationCountry || ''}`, statusLabels[s.status] || s.status])
  }
}

const reportHeaders: Record<string, string[]> = {
  shipment_summary: ['Shipment #', 'Direction', 'Transport', 'Customer', 'Route', 'Status', 'Containers', 'Revenue', 'Expenses', 'Profit'],
  profitability: ['Shipment #', 'Customer', 'Route', 'Revenue', 'Expenses', 'Net Profit', 'Margin %'],
  customer_ledger: ['Customer', 'Shipments', 'Revenue', 'Expenses', 'Net Profit'],
  vendor_ledger: ['Vendor', 'Expense Count', 'Total Expenses'],
  expense_report: ['Shipment #', 'Expense Type', 'Vendor', 'Currency', 'Amount', 'Amount (Base)', 'Tax (Base)', 'Payment Status', 'Date'],
  revenue_report: ['Shipment #', 'Revenue Type', 'Customer', 'Currency', 'Amount', 'Amount (Base)', 'Payment Status', 'Due Date'],
  route_profitability: ['Route', 'Shipments', 'Revenue', 'Expenses', 'Net Profit'],
  country_analysis: ['Country', 'As Origin', 'As Destination', 'Revenue'],
  container_utilization: ['Shipment #', 'Customer', 'Containers', 'Route', 'Status', 'Revenue/Container'],
}

const reportLabels: Record<string, string> = {
  shipment_summary: 'Shipment Summary Report',
  profitability: 'Shipment Profitability Report',
  customer_ledger: 'Customer Ledger',
  vendor_ledger: 'Vendor Ledger',
  expense_report: 'Expense Report',
  revenue_report: 'Revenue Report',
  route_profitability: 'Route Profitability Report',
  country_analysis: 'Country Analysis Report',
  container_utilization: 'Container Utilization Report',
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('reportType') || 'shipment_summary'
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    // Build where clause
    const where: Record<string, unknown> = {}
    if (startDate || endDate) {
      where.etd = {}
      if (startDate) (where.etd as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.etd as Record<string, unknown>).lte = new Date(endDate)
    }

    // Fetch all matching shipments with full data
    const shipments = await db.shipment.findMany({
      where,
      include: {
        customer: { select: { name: true, code: true } },
        containers: true,
        expenses: { include: { vendor: { select: { name: true } } } },
        revenues: { include: { customer: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const headers = reportHeaders[reportType] || ['Shipment #', 'Customer', 'Route', 'Status']
    const rows = buildReportData(shipments as Awaited<ReturnType<typeof db.shipment.findMany>>, reportType)
    const title = reportLabels[reportType] || 'Shipment Report'
    const dateRange = startDate && endDate
      ? `${new Date(startDate).toLocaleDateString('en-US')} — ${new Date(endDate).toLocaleDateString('en-US')}`
      : 'All Dates'

    // Build HTML for PDF generation
    const colCount = headers.length
    const colWidthPct = Math.floor(100 / colCount)

    let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: A4 landscape; margin: 15mm 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 9pt; color: #1a1a2e; background: #fff; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
  .header h1 { font-size: 18pt; color: #10b981; font-weight: 700; }
  .header .meta { text-align: right; font-size: 8pt; color: #666; }
  .header .meta div { margin-bottom: 2px; }
  .subtitle { font-size: 10pt; color: #555; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 8pt; }
  th { background: #10b981; color: #fff; padding: 6px 8px; text-align: left; font-weight: 600; white-space: nowrap; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) { background: #f9fafb; }
  tr:hover { background: #f0fdf4; }
  .footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 7pt; color: #999; display: flex; justify-content: space-between; }
  .profit-positive { color: #059669; font-weight: 600; }
  .profit-negative { color: #dc2626; font-weight: 600; }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>FreightFlow ERP</h1>
    <div class="subtitle">${escapeXml(title)}</div>
  </div>
  <div class="meta">
    <div>Generated: ${new Date().toLocaleDateString('en-US')} ${new Date().toLocaleTimeString('en-US')}</div>
    <div>Period: ${escapeXml(dateRange)}</div>
    <div>Records: ${rows.length}</div>
  </div>
</div>

<table>
<thead>
<tr>${headers.map(h => `<th>${escapeXml(h)}</th>`).join('')}</tr>
</thead>
<tbody>
${rows.map(row => `<tr>${row.map(cell => `<td>${escapeXml(String(cell))}</td>`).join('')}</tr>`).join('\n')}
</tbody>
</table>

<div class="footer">
  <div>FreightFlow Logistics Co. — Confidential</div>
  <div>Page 1</div>
</div>
</body>
</html>`

    // Use Playwright to generate PDF from HTML
    const { chromium } = await import('playwright')
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle' })
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      margin: { top: '15mm', right: '12mm', bottom: '15mm', left: '12mm' },
      printBackground: true,
    })
    await browser.close()

    const filename = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting PDF:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export PDF: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
