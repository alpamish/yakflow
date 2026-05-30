import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'

const statusLabels: Record<string, string> = {
  draft: 'Draft', booked: 'Booked', loading: 'Loading', in_transit: 'In Transit',
  arrived: 'Arrived', customs_clearance: 'Customs Clearance', delivered: 'Delivered', cancelled: 'Cancelled',
}

const expenseTypeLabels: Record<string, string> = {
  othc: 'OTHC', dthc: 'DTHC', x_ray: 'X-RAY', inspection: 'INSPECTION',
  d_and_d: 'D&D', storage: 'STORAGE', doc: 'DOC', pick_up: 'PICK UP',
}

const revenueTypeLabels: Record<string, string> = {
  othc: 'OTHC', dthc: 'DTHC', x_ray: 'X-RAY', inspection: 'INSPECTION',
  d_and_d: 'D&D', storage: 'STORAGE', doc: 'DOC', pick_up: 'PICK UP',
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

    const fmt = (n: number) => Math.round((n || 0) * 100) / 100
    const fmtDate = (d: Date | null) => d ? new Date(d).toLocaleDateString('en-US') : ''

    const wb = XLSX.utils.book_new()

    switch (reportType) {
      case 'shipment_summary': {
        const rows = shipments.map(s => {
          const totalRev = s.revenues.reduce((sum, r) => sum + (r.amount || 0), 0)
          const totalExp = s.expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
          return {
            'Shipment #': s.shipmentNumber,
            'Direction': s.direction.toUpperCase(),
            'Transport': s.transportMode.toUpperCase(),
            'Customer': s.customer?.name || '',
            'Shipper': s.shipper || '',
            'Consignee': s.consignee || '',
            'Origin Country': s.originCountry || '',
            'Destination Country': s.destinationCountry || '',
            'Port of Loading': s.portOfLoading || '',
            'Port of Discharge': s.portOfDischarge || '',
            'ETD': fmtDate(s.etd),
            'ETA': fmtDate(s.eta),
            'Vessel': s.vesselName || '',
            'Voyage #': s.voyageNumber || '',
            'BL #': s.blNumber || '',
            'Booking #': s.bookingNumber || '',
            'Cargo Type': s.cargoType || '',
            'IMO Class': s.imoClass || '',
            'Containers': s.containers.length,
            'Status': statusLabels[s.status] || s.status,
            'Revenue (USD)': fmt(totalRev),
            'Expenses (USD)': fmt(totalExp),
            'Profit (USD)': fmt(totalRev - totalExp),
            'Free Days': s.freeDays || '',
            'Remarks': s.remarks || '',
          }
        })
        const ws = XLSX.utils.json_to_sheet(rows)
        ws['!cols'] = Array.from({ length: 25 }, () => ({ wch: 16 }))
        XLSX.utils.book_append_sheet(wb, ws, 'Shipment Summary')
        break
      }

      case 'profitability': {
        const rows = shipments.map(s => {
          const totalRev = s.revenues.reduce((sum, r) => sum + (r.amount || 0), 0)
          const totalExp = s.expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
          const profit = totalRev - totalExp
          const margin = totalRev > 0 ? (profit / totalRev) * 100 : 0
          return {
            'Shipment #': s.shipmentNumber,
            'Customer': s.customer?.name || '',
            'Route': `${s.originCountry || ''} → ${s.destinationCountry || ''}`,
            'Direction': s.direction.toUpperCase(),
            'Transport': s.transportMode.toUpperCase(),
            'Revenue (USD)': fmt(totalRev),
            'Expenses (USD)': fmt(totalExp),
            'Net Profit (USD)': fmt(profit),
            'Margin %': margin.toFixed(1) + '%',
            'Status': statusLabels[s.status] || s.status,
          }
        })
        // Add totals row
        const totalRev = rows.reduce((s, r) => s + (r['Revenue (USD)'] as number), 0)
        const totalExp = rows.reduce((s, r) => s + (r['Expenses (USD)'] as number), 0)
        rows.push({
          'Shipment #': 'TOTAL',
          'Customer': '', 'Route': '', 'Direction': '', 'Transport': '',
          'Revenue (USD)': fmt(totalRev),
          'Expenses (USD)': fmt(totalExp),
          'Net Profit (USD)': fmt(totalRev - totalExp),
          'Margin %': totalRev > 0 ? ((totalRev - totalExp) / totalRev * 100).toFixed(1) + '%' : '0%',
          'Status': '',
        })
        const ws = XLSX.utils.json_to_sheet(rows)
        ws['!cols'] = Array.from({ length: 10 }, () => ({ wch: 18 }))
        XLSX.utils.book_append_sheet(wb, ws, 'Profitability')
        break
      }

      case 'customer_ledger': {
        const customerMap: Record<string, { name: string; code: string; shipments: number; revenue: number; expenses: number }> = {}
        for (const s of shipments) {
          const key = s.customer?.name || 'Unknown'
          const totalRev = s.revenues.reduce((sum, r) => sum + (r.amount || 0), 0)
          const totalExp = s.expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
          if (!customerMap[key]) customerMap[key] = { name: key, code: s.customer?.code || '', shipments: 0, revenue: 0, expenses: 0 }
          customerMap[key].shipments++
          customerMap[key].revenue += totalRev
          customerMap[key].expenses += totalExp
        }
        const rows = Object.values(customerMap).sort((a, b) => b.revenue - a.revenue).map(c => ({
          'Customer': c.name,
          'Code': c.code,
          'Total Shipments': c.shipments,
          'Total Revenue (USD)': fmt(c.revenue),
          'Total Expenses (USD)': fmt(c.expenses),
          'Net Profit (USD)': fmt(c.revenue - c.expenses),
          'Margin %': c.revenue > 0 ? ((c.revenue - c.expenses) / c.revenue * 100).toFixed(1) + '%' : '0%',
        }))
        const ws = XLSX.utils.json_to_sheet(rows)
        ws['!cols'] = Array.from({ length: 7 }, () => ({ wch: 20 }))
        XLSX.utils.book_append_sheet(wb, ws, 'Customer Ledger')
        break
      }

      case 'vendor_ledger': {
        const vendorMap: Record<string, { name: string; expenses: number; count: number }> = {}
        for (const s of shipments) {
          for (const e of s.expenses) {
            const key = e.vendor?.name || 'Unknown'
            if (!vendorMap[key]) vendorMap[key] = { name: key, expenses: 0, count: 0 }
            vendorMap[key].expenses += e.amount || 0
            vendorMap[key].count++
          }
        }
        const rows = Object.values(vendorMap).sort((a, b) => b.expenses - a.expenses).map(v => ({
          'Vendor': v.name,
          'Expense Count': v.count,
          'Total Expenses (USD)': fmt(v.expenses),
        }))
        const ws = XLSX.utils.json_to_sheet(rows)
        ws['!cols'] = Array.from({ length: 3 }, () => ({ wch: 22 }))
        XLSX.utils.book_append_sheet(wb, ws, 'Vendor Ledger')
        break
      }

      case 'expense_report': {
        const rows: Record<string, unknown>[] = []
        for (const s of shipments) {
          for (const e of s.expenses) {
            rows.push({
              'Shipment #': s.shipmentNumber,
              'Expense Type': expenseTypeLabels[e.expenseType] || e.expenseType,
              'Vendor': e.vendor?.name || '',
              'Qty': e.quantity ?? 1,
              'Unit Price': fmt(e.unitPrice ?? 0),
              'Total': fmt(e.amount || 0),
              'Payment Status': e.paymentStatus,
              'Invoice #': e.invoiceNumber || '',
              'Notes': e.notes || '',
              'Date': fmtDate(e.expenseDate),
            })
          }
        }
        const ws = XLSX.utils.json_to_sheet(rows)
        ws['!cols'] = Array.from({ length: 13 }, () => ({ wch: 16 }))
        XLSX.utils.book_append_sheet(wb, ws, 'Expense Report')
        break
      }

      case 'revenue_report': {
        const rows: Record<string, unknown>[] = []
        for (const s of shipments) {
          for (const r of s.revenues) {
            rows.push({
              'Shipment #': s.shipmentNumber,
              'Revenue Type': revenueTypeLabels[r.revenueType] || r.revenueType,
              'Customer': r.customer?.name || '',
              'Qty': r.quantity ?? 1,
              'Unit Price': fmt(r.unitPrice ?? 0),
              'Total': fmt(r.amount || 0),
              'Payment Status': r.paymentStatus,
              'Invoice #': r.invoiceNumber || '',
              'Due Date': fmtDate(r.dueDate),
            })
          }
        }
        const ws = XLSX.utils.json_to_sheet(rows)
        ws['!cols'] = Array.from({ length: 12 }, () => ({ wch: 16 }))
        XLSX.utils.book_append_sheet(wb, ws, 'Revenue Report')
        break
      }

      case 'route_profitability': {
        const routeMap: Record<string, { route: string; shipments: number; revenue: number; expenses: number }> = {}
        for (const s of shipments) {
          const route = `${s.originCountry || '—'} → ${s.destinationCountry || '—'}`
          const totalRev = s.revenues.reduce((sum, r) => sum + (r.amount || 0), 0)
          const totalExp = s.expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
          if (!routeMap[route]) routeMap[route] = { route, shipments: 0, revenue: 0, expenses: 0 }
          routeMap[route].shipments++
          routeMap[route].revenue += totalRev
          routeMap[route].expenses += totalExp
        }
        const rows = Object.values(routeMap).sort((a, b) => (b.revenue - b.expenses) - (a.revenue - a.expenses)).map(r => ({
          'Route': r.route,
          'Shipments': r.shipments,
          'Revenue (USD)': fmt(r.revenue),
          'Expenses (USD)': fmt(r.expenses),
          'Net Profit (USD)': fmt(r.revenue - r.expenses),
          'Margin %': r.revenue > 0 ? ((r.revenue - r.expenses) / r.revenue * 100).toFixed(1) + '%' : '0%',
        }))
        const ws = XLSX.utils.json_to_sheet(rows)
        ws['!cols'] = Array.from({ length: 6 }, () => ({ wch: 20 }))
        XLSX.utils.book_append_sheet(wb, ws, 'Route Profitability')
        break
      }

      case 'country_analysis': {
        const countryMap: Record<string, { country: string; asOrigin: number; asDestination: number; revenue: number }> = {}
        for (const s of shipments) {
          const totalRev = s.revenues.reduce((sum, r) => sum + (r.amount || 0), 0)
          if (s.originCountry) {
            if (!countryMap[s.originCountry]) countryMap[s.originCountry] = { country: s.originCountry, asOrigin: 0, asDestination: 0, revenue: 0 }
            countryMap[s.originCountry].asOrigin++
            countryMap[s.originCountry].revenue += totalRev
          }
          if (s.destinationCountry) {
            if (!countryMap[s.destinationCountry]) countryMap[s.destinationCountry] = { country: s.destinationCountry, asOrigin: 0, asDestination: 0, revenue: 0 }
            countryMap[s.destinationCountry].asDestination++
            countryMap[s.destinationCountry].revenue += totalRev
          }
        }
        const rows = Object.values(countryMap).sort((a, b) => b.revenue - a.revenue).map(c => ({
          'Country': c.country,
          'As Origin': c.asOrigin,
          'As Destination': c.asDestination,
          'Associated Revenue (USD)': fmt(c.revenue),
        }))
        const ws = XLSX.utils.json_to_sheet(rows)
        ws['!cols'] = Array.from({ length: 4 }, () => ({ wch: 22 }))
        XLSX.utils.book_append_sheet(wb, ws, 'Country Analysis')
        break
      }

      case 'container_utilization': {
        const rows = shipments.map(s => {
          const totalRev = s.revenues.reduce((sum, r) => sum + (r.amount || 0), 0)
          const cnt = s.containers.length
          return {
            'Shipment #': s.shipmentNumber,
            'Customer': s.customer?.name || '',
            'Container Count': cnt,
            '20ft': s.containers.filter(c => c.containerSize === '20').length,
            '40ft': s.containers.filter(c => c.containerSize === '40' || c.containerSize === '45').length,
            'Reefer': s.containers.filter(c => c.containerType === 'Reefer').length,
            'Route': `${s.originCountry || ''} → ${s.destinationCountry || ''}`,
            'Status': statusLabels[s.status] || s.status,
            'Revenue (USD)': fmt(totalRev),
            'Revenue/Container (USD)': cnt > 0 ? fmt(totalRev / cnt) : 0,
          }
        })
        const ws = XLSX.utils.json_to_sheet(rows)
        ws['!cols'] = Array.from({ length: 10 }, () => ({ wch: 18 }))
        XLSX.utils.book_append_sheet(wb, ws, 'Container Utilization')
        break
      }

      default: {
        const rows = shipments.map(s => ({
          'Shipment #': s.shipmentNumber,
          'Customer': s.customer?.name || '',
          'Route': `${s.originCountry || ''} → ${s.destinationCountry || ''}`,
          'Status': statusLabels[s.status] || s.status,
        }))
        const ws = XLSX.utils.json_to_sheet(rows)
        XLSX.utils.book_append_sheet(wb, ws, 'Report')
      }
    }

    // Generate buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })

    // Return as downloadable file
    const reportLabel = reportTypes.find(r => r.value === reportType)?.label || 'Report'
    const filename = `${reportLabel.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting Excel:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export Excel' },
      { status: 500 }
    )
  }
}

const reportTypes = [
  { value: 'shipment_summary', label: 'Shipment Summary' },
  { value: 'profitability', label: 'Profitability Report' },
  { value: 'customer_ledger', label: 'Customer Ledger' },
  { value: 'vendor_ledger', label: 'Vendor Ledger' },
  { value: 'expense_report', label: 'Expense Report' },
  { value: 'revenue_report', label: 'Revenue Report' },
  { value: 'route_profitability', label: 'Route Profitability' },
  { value: 'country_analysis', label: 'Country Analysis' },
  { value: 'container_utilization', label: 'Container Utilization' },
]
