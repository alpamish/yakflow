'use client'

import React, { useState, useEffect } from 'react'
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  Package, Anchor, Users, Truck, Wallet, Box,
  TrendingUp, TrendingDown, BarChart3, FileSpreadsheet,
  Download, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SummaryData {
  companyInfo: { name: string; baseCurrency: string }
  shipmentSummary: {
    totalShipments: number
    byStatus: Record<string, number>
    byDirection: Record<string, number>
    byTransportMode: Record<string, number>
    totalContainers: number
    totalRevenue: number
    totalExpenses: number
    netProfit: number
  }
  voyageSummary: {
    totalVoyages: number
    byStatus: Record<string, number>
    totalTEUs: number
    avgUtilization: number
    totalRevenue: number
    totalExpenses: number
    netProfit: number
  }
  customerSummary: {
    totalCustomers: number
    activeCustomers: number
    top5ByRevenue: { customerId: string; customerName: string; totalRevenue: number }[]
  }
  vendorSummary: {
    totalVendors: number
    activeVendors: number
    top5ByExpense: { vendorId: string; vendorName: string; totalExpense: number }[]
  }
  financialSummary: {
    totalInvoices: number
    byStatus: Record<string, number>
    totalSubtotal: number
    totalTax: number
    totalInvoiceAmount: number
    totalPayments: number
    byPaymentMethod: Record<string, number>
    totalPaymentAmount: number
    accountsReceivable: number
    accountsPayable: number
    byCurrency: Record<string, { count: number; totalAmount: number; totalBase: number }>
  }
  containerSummary: {
    totalContainers: number
    byType: Record<string, number>
    byStatus: Record<string, number>
    reeferCount: number
    specialUnitsCount: number
  }
  expenseBreakdown: { type: string; total: number }[]
  revenueBreakdown: { type: string; total: number }[]
  monthlyTrends: { month: string; shipmentCount: number; revenue: number; expenses: number }[]
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', booked: 'Booked', loading: 'Loading', in_transit: 'In Transit',
  arrived: 'Arrived', customs_clearance: 'Customs Clearance', delivered: 'Delivered',
  cancelled: 'Cancelled', planned: 'Planned', departed: 'Departed', completed: 'Completed',
  sent: 'Sent', paid: 'Paid', overdue: 'Overdue', pending: 'Pending', failed: 'Failed',
  refunded: 'Refunded', empty: 'Empty', loaded: 'Loaded',
}

const EXPENSE_LABELS: Record<string, string> = {
  ocean_freight: 'Ocean Freight', port_charges: 'Port Charges', fuel_costs: 'Fuel Costs',
  bunker_costs: 'Bunker Costs', canal_fees: 'Canal Fees', rail_costs: 'Rail Costs',
  customs: 'Customs', x_ray: 'X-Ray', terminal_handling: 'Terminal Handling',
  agency_costs: 'Agency Costs', documentation: 'Documentation', crew_costs: 'Crew Costs',
  miscellaneous: 'Miscellaneous', dthc: 'DTHC', othc: 'OTHC', railways: 'Railways',
  inspection: 'Inspection', fuel: 'Fuel', toll: 'Toll', driver_expense: 'Driver Expense',
  handling_charges: 'Handling Charges', warehouse_charges: 'Warehouse Charges',
  agency_charges: 'Agency Charges',
  d_and_d: 'D&D', storage: 'STORAGE', doc: 'DOC', pick_up: 'PICK UP',
}

const REVENUE_LABELS: Record<string, string> = {
  freight_income: 'Freight Income', slot_revenue: 'Slot Revenue', surcharges: 'Surcharges',
  handling_income: 'Handling Income', service_charges: 'Service Charges',
  freight_charges: 'Freight Charges', delivery_charges: 'Delivery Charges',
  customs_charges: 'Customs Charges', documentation_fees: 'Documentation Fees',
  handling_fees: 'Handling Fees', storage_charges: 'Storage Charges',
  other_charges: 'Other Charges',
  othc: 'OTHC', dthc: 'DTHC', x_ray: 'X-RAY', inspection: 'INSPECTION',
  d_and_d: 'D&D', storage: 'STORAGE', doc: 'DOC', pick_up: 'PICK UP',
}

function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '\u20ac', GBP: '\u00a3', RUB: '\u20bd', CNY: '\u00a5', JPY: '\u00a5',
    KRW: '\u20a9', INR: '\u20b9', CHF: 'CHF', CAD: 'C$', AUD: 'A$', BRL: 'R$',
  }
  return symbols[code] || code + ' '
}

// Shared CSS class constants
const S = {
  table: 'w-full border-collapse text-sm',
  header: 'bg-teal-700 text-white font-semibold text-xs uppercase tracking-wider px-3 py-2.5 border-b-2 border-teal-800 text-left whitespace-nowrap',
  cell: 'px-3 py-2 border-b border-muted text-foreground',
  cellR: 'px-3 py-2 border-b border-muted text-foreground text-left font-mono tabular-nums',
  cellB: 'px-3 py-2 border-b border-muted text-foreground font-semibold',
  cellBR: 'px-3 py-2 border-b border-muted text-foreground font-semibold text-left font-mono tabular-nums',
  totalRow: 'bg-teal-700/10',
  totalCell: 'px-3 py-2.5 font-bold text-foreground text-sm',
  totalCellR: 'px-3 py-2.5 font-bold text-foreground text-sm text-left font-mono tabular-nums',
  subHeader: 'bg-muted/50 text-xs font-semibold text-muted-foreground px-3 py-1.5 uppercase tracking-wider',
  evenRow: 'bg-muted/20',
}

export function SummaryPage() {
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/summary')
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        setError(json.error || 'Failed to fetch summary')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="size-7 text-teal-600" />
          <div>
            <h1 className="text-2xl font-bold">ERP Summary</h1>
            <p className="text-sm text-muted-foreground">Comprehensive spreadsheet overview</p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error || 'No data available'}</p>
            <Button onClick={fetchData} variant="outline">
              <RefreshCw className="size-4 mr-2" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const cur = data.companyInfo.baseCurrency || 'USD'
  const sym = getCurrencySymbol(cur)
  const curLabel = 'Amount (' + cur + ')'
  const revLabel = 'Revenue (' + cur + ')'
  const expLabel = 'Expense (' + cur + ')'
  const expsLabel = 'Expenses (' + cur + ')'
  const profitLabel = 'Net Profit (' + cur + ')'

  const fmt = (n: number) => {
    if (Math.abs(n) >= 10000) return sym + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
    if (Math.abs(n) >= 1) return sym + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return sym + n.toFixed(2)
  }

  const pct = (n: number, total: number) => total > 0 ? ((n / total) * 100).toFixed(1) + '%' : '0%'

  const totalRevenue = data.shipmentSummary.totalRevenue + data.voyageSummary.totalRevenue
  const totalExpenses = data.shipmentSummary.totalExpenses + data.voyageSummary.totalExpenses
  const totalProfit = totalRevenue - totalExpenses

  const handleExportCSV = () => {
    if (!data) return
    const lines: string[] = []
    lines.push('FreightFlow ERP - Summary Report')
    lines.push('Company,' + data.companyInfo.name)
    lines.push('Base Currency,' + data.companyInfo.baseCurrency)
    lines.push('')
    lines.push('SHIPMENT SUMMARY')
    lines.push('Metric,Value')
    lines.push('Total Shipments,' + data.shipmentSummary.totalShipments)
    lines.push('Total Containers,' + data.shipmentSummary.totalContainers)
    lines.push('Revenue,' + data.shipmentSummary.totalRevenue)
    lines.push('Expenses,' + data.shipmentSummary.totalExpenses)
    lines.push('Net Profit,' + data.shipmentSummary.netProfit)
    lines.push('')
    lines.push('VOYAGE SUMMARY')
    lines.push('Metric,Value')
    lines.push('Total Voyages,' + data.voyageSummary.totalVoyages)
    lines.push('Total TEUs,' + data.voyageSummary.totalTEUs)
    lines.push('Avg Utilization,' + data.voyageSummary.avgUtilization + '%')
    lines.push('Revenue,' + data.voyageSummary.totalRevenue)
    lines.push('Expenses,' + data.voyageSummary.totalExpenses)
    lines.push('Net Profit,' + data.voyageSummary.netProfit)
    lines.push('')
    lines.push('EXPENSE BREAKDOWN')
    lines.push('Type,Amount')
    data.expenseBreakdown.forEach(e => lines.push((EXPENSE_LABELS[e.type] || e.type) + ',' + e.total))
    lines.push('')
    lines.push('REVENUE BREAKDOWN')
    lines.push('Type,Amount')
    data.revenueBreakdown.forEach(r => lines.push((REVENUE_LABELS[r.type] || r.type) + ',' + r.total))
    lines.push('')
    lines.push('MONTHLY TRENDS')
    lines.push('Month,Shipments,Revenue,Expenses')
    data.monthlyTrends.forEach(t => lines.push(t.month + ',' + t.shipmentCount + ',' + t.revenue + ',' + t.expenses))

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'erp-summary-' + new Date().toISOString().split('T')[0] + '.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = async () => {
    if (!data) return
    const { pdf } = await import('@react-pdf/renderer')
    const { SummaryPDF } = await import('./summary-pdf')
    const blob = await pdf(<SummaryPDF data={data} />).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'erp-summary-' + new Date().toISOString().split('T')[0] + '.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-teal-600 text-white">
            <FileSpreadsheet className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Summary</h1>
            <p className="text-sm text-muted-foreground">{data.companyInfo.name} &mdash; Comprehensive spreadsheet overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="size-4 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="size-4 mr-1" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileSpreadsheet className="size-4 mr-1" /> Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-px bg-border rounded-lg overflow-hidden">
        {[
          { label: 'Total Revenue', value: fmt(totalRevenue), color: 'text-emerald-600' },
          { label: 'Total Expenses', value: fmt(totalExpenses), color: 'text-red-600' },
          { label: 'Shipments', value: String(data.shipmentSummary.totalShipments) },
          { label: 'Voyages', value: String(data.voyageSummary.totalVoyages) },
          { label: 'Containers', value: String(data.containerSummary.totalContainers) },
        ].map((item, i) => (
          <div key={i} className="bg-background px-4 py-3 flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</span>
            <span className={'text-lg font-bold tabular-nums ' + (item.color || 'text-foreground')}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Combined Financial Overview */}
      <Card className="overflow-hidden border-2 border-teal-200 dark:border-teal-900">
        <CardHeader className="bg-gradient-to-r from-teal-700 to-teal-600 text-white py-3 px-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Wallet className="size-4" /> Combined Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className={S.table}>
              <thead>
                <tr>
                  <th className={S.header} style={{width: "34%"}}>Category</th>
                  <th className={S.header} style={{width: "22%"}}>Shipment Ops</th>
                  <th className={S.header} style={{width: "22%"}}>Voyage Finance</th>
                  <th className={S.header} style={{width: "22%"}}>Combined Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={S.cellB}><span className="inline-block size-2.5 rounded-full bg-emerald-500 mr-2" />Gross Revenue</td>
                  <td className={S.cellR}>{fmt(data.shipmentSummary.totalRevenue)}</td>
                  <td className={S.cellR}>{fmt(data.voyageSummary.totalRevenue)}</td>
                  <td className={S.cellBR}>{fmt(totalRevenue)}</td>
                </tr>
                <tr className={S.evenRow}>
                  <td className={S.cellB}><span className="inline-block size-2.5 rounded-full bg-red-500 mr-2" />Total Expenses</td>
                  <td className={S.cellR}>{fmt(data.shipmentSummary.totalExpenses)}</td>
                  <td className={S.cellR}>{fmt(data.voyageSummary.totalExpenses)}</td>
                  <td className={S.cellBR}>{fmt(totalExpenses)}</td>
                </tr>
                <tr className={S.totalRow}>
                  <td className={S.totalCell}><span className="inline-block size-2.5 rounded-full bg-teal-600 mr-2" />Net Profit</td>
                  <td className={S.totalCellR}>{fmt(data.shipmentSummary.netProfit)}</td>
                  <td className={S.totalCellR}>{fmt(data.voyageSummary.netProfit)}</td>
                  <td className={S.totalCellR}>{fmt(totalProfit)}</td>
                </tr>
                <tr>
                  <td className={S.cell}><span className="text-muted-foreground">Profit Margin</span></td>
                  <td className={S.cellR}>{data.shipmentSummary.totalRevenue > 0 ? ((data.shipmentSummary.netProfit / data.shipmentSummary.totalRevenue) * 100).toFixed(1) + '%' : '--'}</td>
                  <td className={S.cellR}>{data.voyageSummary.totalRevenue > 0 ? ((data.voyageSummary.netProfit / data.voyageSummary.totalRevenue) * 100).toFixed(1) + '%' : '--'}</td>
                  <td className={S.cellBR}>{totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) + '%' : '--'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Two-column: Shipment + Voyage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Shipment Summary */}
        <Card className="overflow-hidden border border-border">
          <CardHeader className="bg-gradient-to-r from-teal-700 to-teal-600 text-white py-3 px-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2"><Package className="size-4" /> Shipment Operations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className={S.table}>
                <thead><tr><th className={S.header}>Metric</th><th className={S.header}>Value</th></tr></thead>
                <tbody>
                  <tr><td className={S.subHeader} colSpan={2}>Overview</td></tr>
                  <tr><td className={S.cell}>Total Shipments</td><td className={S.cellR}>{data.shipmentSummary.totalShipments}</td></tr>
                  <tr><td className={S.subHeader} colSpan={2}>By Status</td></tr>
                  {Object.entries(data.shipmentSummary.byStatus).map(([k, v], i) => (
                    <tr key={k} className={i % 2 === 1 ? S.evenRow : undefined}><td className={S.cell}>{STATUS_LABELS[k] || k}</td><td className={S.cellR}>{v}</td></tr>
                  ))}
                  <tr><td className={S.subHeader} colSpan={2}>By Direction</td></tr>
                  {Object.entries(data.shipmentSummary.byDirection).map(([k, v], i) => (
                    <tr key={k} className={i % 2 === 1 ? S.evenRow : undefined}><td className={S.cell}>{k.charAt(0).toUpperCase() + k.slice(1)}</td><td className={S.cellR}>{v}</td></tr>
                  ))}
                  <tr><td className={S.subHeader} colSpan={2}>By Transport Mode</td></tr>
                  {Object.entries(data.shipmentSummary.byTransportMode).map(([k, v], i) => (
                    <tr key={k} className={i % 2 === 1 ? S.evenRow : undefined}><td className={S.cell}>{k.charAt(0).toUpperCase() + k.slice(1)}</td><td className={S.cellR}>{v}</td></tr>
                  ))}
                  <tr className={S.totalRow}><td className={S.totalCell}>Shipment Net Profit</td><td className={S.totalCellR}>{fmt(data.shipmentSummary.netProfit)}</td></tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Voyage Summary */}
        <Card className="overflow-hidden border border-border">
          <CardHeader className="bg-gradient-to-r from-teal-700 to-teal-600 text-white py-3 px-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2"><Anchor className="size-4" /> Voyage Finance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className={S.table}>
                <thead><tr><th className={S.header}>Metric</th><th className={S.header}>Value</th></tr></thead>
                <tbody>
                  <tr><td className={S.subHeader} colSpan={2}>Overview</td></tr>
                  <tr><td className={S.cell}>Total Voyages</td><td className={S.cellR}>{data.voyageSummary.totalVoyages}</td></tr>
                  <tr className={S.evenRow}><td className={S.cell}>Total TEUs</td><td className={S.cellR}>{data.voyageSummary.totalTEUs.toLocaleString()}</td></tr>
                  <tr><td className={S.cell}>Avg Utilization</td><td className={S.cellR}>{data.voyageSummary.avgUtilization.toFixed(1)}%</td></tr>
                  <tr><td className={S.subHeader} colSpan={2}>By Status</td></tr>
                  {Object.entries(data.voyageSummary.byStatus).map(([k, v], i) => (
                    <tr key={k} className={i % 2 === 1 ? S.evenRow : undefined}><td className={S.cell}>{STATUS_LABELS[k] || k}</td><td className={S.cellR}>{v}</td></tr>
                  ))}
                  <tr><td className={S.subHeader} colSpan={2}>Financials</td></tr>
                  <tr><td className={S.cell}>Voyage Revenue</td><td className={S.cellR}>{fmt(data.voyageSummary.totalRevenue)}</td></tr>
                  <tr className={S.evenRow}><td className={S.cell}>Voyage Expenses</td><td className={S.cellR}>{fmt(data.voyageSummary.totalExpenses)}</td></tr>
                  <tr className={S.totalRow}><td className={S.totalCell}>Voyage Net Profit</td><td className={S.totalCellR}>{fmt(data.voyageSummary.netProfit)}</td></tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown */}
      <Card className="overflow-hidden border border-border">
        <CardHeader className="bg-gradient-to-r from-teal-700 to-teal-600 text-white py-3 px-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2"><TrendingDown className="size-4" /> Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className={S.table}>
              <thead>
                <tr>
                  <th className={S.header} style={{width: "40%"}}>Expense Type</th>
                  <th className={S.header} style={{width: "25%"}}>{curLabel}</th>
                  <th className={S.header} style={{width: "20%"}}>% of Total</th>
                  <th className={S.header} style={{width: "15%"}}>Bar</th>
                </tr>
              </thead>
              <tbody>
                {data.expenseBreakdown.map((item, i) => {
                  const grandTotal = data.expenseBreakdown.reduce((s, e) => s + e.total, 0)
                  const barPct = grandTotal > 0 ? (item.total / grandTotal) * 100 : 0
                  return (
                    <tr key={i} className={i % 2 === 1 ? S.evenRow : undefined}>
                      <td className={S.cell}>
                        <span className="inline-block size-2.5 rounded-full mr-2" style={{backgroundColor: 'hsl(' + ((i * 37 + 15) % 360) + ', 65%, 50%)'}} />
                        {EXPENSE_LABELS[item.type] || item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </td>
                      <td className={S.cellR}>{fmt(item.total)}</td>
                      <td className={S.cellR}>{pct(item.total, grandTotal)}</td>
                      <td className="px-3 py-2">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-red-400 h-2 rounded-full transition-all" style={{width: Math.min(barPct, 100) + "%"}} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
                <tr className={S.totalRow}>
                  <td className={S.totalCell}>TOTAL EXPENSES</td>
                  <td className={S.totalCellR}>{fmt(data.expenseBreakdown.reduce((s, e) => s + e.total, 0))}</td>
                  <td className={S.totalCellR}>100%</td>
                  <td className="px-3 py-2.5"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <Card className="overflow-hidden border border-border">
        <CardHeader className="bg-gradient-to-r from-teal-700 to-teal-600 text-white py-3 px-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2"><TrendingUp className="size-4" /> Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className={S.table}>
              <thead>
                <tr>
                  <th className={S.header} style={{width: "40%"}}>Revenue Type</th>
                  <th className={S.header} style={{width: "25%"}}>{curLabel}</th>
                  <th className={S.header} style={{width: "20%"}}>% of Total</th>
                  <th className={S.header} style={{width: "15%"}}>Bar</th>
                </tr>
              </thead>
              <tbody>
                {data.revenueBreakdown.map((item, i) => {
                  const grandTotal = data.revenueBreakdown.reduce((s, r) => s + r.total, 0)
                  const barPct = grandTotal > 0 ? (item.total / grandTotal) * 100 : 0
                  return (
                    <tr key={i} className={i % 2 === 1 ? S.evenRow : undefined}>
                      <td className={S.cell}>
                        <span className="inline-block size-2.5 rounded-full mr-2" style={{backgroundColor: 'hsl(' + ((i * 47 + 140) % 360) + ', 65%, 50%)'}} />
                        {REVENUE_LABELS[item.type] || item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </td>
                      <td className={S.cellR}>{fmt(item.total)}</td>
                      <td className={S.cellR}>{pct(item.total, grandTotal)}</td>
                      <td className="px-3 py-2">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-emerald-400 h-2 rounded-full transition-all" style={{width: Math.min(barPct, 100) + "%"}} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
                <tr className={S.totalRow}>
                  <td className={S.totalCell}>TOTAL REVENUE</td>
                  <td className={S.totalCellR}>{fmt(data.revenueBreakdown.reduce((s, r) => s + r.total, 0))}</td>
                  <td className={S.totalCellR}>100%</td>
                  <td className="px-3 py-2.5"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Container + Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="overflow-hidden border border-border">
          <CardHeader className="bg-gradient-to-r from-teal-700 to-teal-600 text-white py-3 px-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2"><Box className="size-4" /> Container Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className={S.table}>
                <thead><tr><th className={S.header}>Metric</th><th className={S.header}>Count</th><th className={S.header}>Share</th></tr></thead>
                <tbody>
                  <tr className={S.totalRow}><td className={S.totalCell}>Total Containers</td><td className={S.totalCellR}>{data.containerSummary.totalContainers}</td><td className={S.totalCellR}>100%</td></tr>
                  <tr><td className={S.subHeader} colSpan={3}>By Type</td></tr>
                  {Object.entries(data.containerSummary.byType).map(([k, v], i) => (
                    <tr key={k} className={i % 2 === 1 ? S.evenRow : undefined}><td className={S.cell}>{k}&apos; Container</td><td className={S.cellR}>{v}</td><td className={S.cellR}>{pct(v, data.containerSummary.totalContainers)}</td></tr>
                  ))}
                  <tr><td className={S.subHeader} colSpan={3}>By Status</td></tr>
                  {Object.entries(data.containerSummary.byStatus).map(([k, v], i) => (
                    <tr key={k} className={i % 2 === 1 ? S.evenRow : undefined}><td className={S.cell}>{STATUS_LABELS[k] || k.replace(/_/g, ' ')}</td><td className={S.cellR}>{v}</td><td className={S.cellR}>{pct(v, data.containerSummary.totalContainers)}</td></tr>
                  ))}
                  <tr><td className={S.subHeader} colSpan={3}>Special Units</td></tr>
                  <tr><td className={S.cell}>Reefer Units</td><td className={S.cellR}>{data.containerSummary.reeferCount}</td><td className={S.cellR}>{pct(data.containerSummary.reeferCount, data.containerSummary.totalContainers)}</td></tr>
                  <tr className={S.evenRow}><td className={S.cell}>Special Units</td><td className={S.cellR}>{data.containerSummary.specialUnitsCount}</td><td className={S.cellR}>{pct(data.containerSummary.specialUnitsCount, data.containerSummary.totalContainers)}</td></tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-border">
          <CardHeader className="bg-gradient-to-r from-teal-700 to-teal-600 text-white py-3 px-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2"><Wallet className="size-4" /> Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className={S.table}>
                <thead><tr><th className={S.header}>Metric</th><th className={S.header}>Value</th></tr></thead>
                <tbody>
                  <tr><td className={S.subHeader} colSpan={2}>Invoices</td></tr>
                  <tr><td className={S.cell}>Total Invoices</td><td className={S.cellR}>{data.financialSummary.totalInvoices}</td></tr>
                  <tr className={S.evenRow}><td className={S.cell}>Subtotal</td><td className={S.cellR}>{fmt(data.financialSummary.totalSubtotal)}</td></tr>
                  <tr><td className={S.cell}>Tax</td><td className={S.cellR}>{fmt(data.financialSummary.totalTax)}</td></tr>
                  <tr className={S.totalRow}><td className={S.totalCell}>Total Invoice Amount</td><td className={S.totalCellR}>{fmt(data.financialSummary.totalInvoiceAmount)}</td></tr>
                  <tr><td className={S.subHeader} colSpan={2}>Payments</td></tr>
                  <tr><td className={S.cell}>Total Payments</td><td className={S.cellR}>{data.financialSummary.totalPayments}</td></tr>
                  <tr className={S.evenRow}><td className={S.cell}>Total Payment Amount</td><td className={S.cellR}>{fmt(data.financialSummary.totalPaymentAmount)}</td></tr>
                  <tr><td className={S.subHeader} colSpan={2}>Balances</td></tr>
                  <tr><td className={S.cell}><span className="inline-block size-2.5 rounded-full bg-emerald-500 mr-2" />Accounts Receivable</td><td className={S.cellR}>{fmt(data.financialSummary.accountsReceivable)}</td></tr>
                  <tr className={S.evenRow}><td className={S.cell}><span className="inline-block size-2.5 rounded-full bg-red-500 mr-2" />Accounts Payable</td><td className={S.cellR}>{fmt(data.financialSummary.accountsPayable)}</td></tr>
                  <tr className={S.totalRow}><td className={S.totalCell}>Net Receivable</td><td className={S.totalCellR + (data.financialSummary.accountsReceivable - data.financialSummary.accountsPayable >= 0 ? ' text-emerald-600' : ' text-red-600')}>{fmt(data.financialSummary.accountsReceivable - data.financialSummary.accountsPayable)}</td></tr>
                  {Object.entries(data.financialSummary.byCurrency).length > 0 && (
                    <>
                      <tr><td className={S.subHeader} colSpan={2}>Currency Breakdown</td></tr>
                      {Object.entries(data.financialSummary.byCurrency).map(([code, info], i) => (
                        <tr key={code} className={i % 2 === 1 ? S.evenRow : undefined}>
                          <td className={S.cell}><span className="font-semibold">{code}</span> &mdash; {info.count} invoice{info.count !== 1 ? 's' : ''}</td>
                          <td className={S.cellR}>{getCurrencySymbol(code)}{info.totalAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers + Top Vendors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="overflow-hidden border border-border">
          <CardHeader className="bg-gradient-to-r from-teal-700 to-teal-600 text-white py-3 px-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2"><Users className="size-4" /> Top 5 Customers by Revenue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className={S.table}>
                <thead>
                  <tr>
                    <th className={S.header} style={{width: "8%"}}>No.</th>
                    <th className={S.header} style={{width: "42%"}}>Customer</th>
                    <th className={S.header} style={{width: "30%"}}>{revLabel}</th>
                    <th className={S.header} style={{width: "20%"}}>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.customerSummary.top5ByRevenue.map((c, i) => {
                    const allRev = data.customerSummary.top5ByRevenue.reduce((s, x) => s + x.totalRevenue, 0)
                    return (
                      <tr key={c.customerId} className={i % 2 === 1 ? S.evenRow : undefined}>
                        <td className={S.cell + ' text-muted-foreground'}>{i + 1}</td>
                        <td className={S.cell}>{c.customerName}</td>
                        <td className={S.cellR}>{fmt(c.totalRevenue)}</td>
                        <td className={S.cellR}>{pct(c.totalRevenue, allRev)}</td>
                      </tr>
                    )
                  })}
                  <tr className={S.totalRow}>
                    <td className={S.totalCell}></td>
                    <td className={S.totalCell}>TOTAL (Top 5)</td>
                    <td className={S.totalCellR}>{fmt(data.customerSummary.top5ByRevenue.reduce((s, c) => s + c.totalRevenue, 0))}</td>
                    <td className={S.totalCellR}>--</td>
                  </tr>
                  <tr>
                    <td className={S.cell} colSpan={2}><span className="text-muted-foreground">Total Customers</span></td>
                    <td className={S.cellR} colSpan={2}>{data.customerSummary.totalCustomers} ({data.customerSummary.activeCustomers} active)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-border">
          <CardHeader className="bg-gradient-to-r from-teal-700 to-teal-600 text-white py-3 px-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2"><Truck className="size-4" /> Top 5 Vendors by Expense</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className={S.table}>
                <thead>
                  <tr>
                    <th className={S.header} style={{width: "8%"}}>No.</th>
                    <th className={S.header} style={{width: "42%"}}>Vendor</th>
                    <th className={S.header} style={{width: "30%"}}>{expLabel}</th>
                    <th className={S.header} style={{width: "20%"}}>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.vendorSummary.top5ByExpense.length > 0 ? data.vendorSummary.top5ByExpense.map((v, i) => {
                    const allExp = data.vendorSummary.top5ByExpense.reduce((s, x) => s + x.totalExpense, 0)
                    return (
                      <tr key={v.vendorId} className={i % 2 === 1 ? S.evenRow : undefined}>
                        <td className={S.cell + ' text-muted-foreground'}>{i + 1}</td>
                        <td className={S.cell}>{v.vendorName}</td>
                        <td className={S.cellR}>{fmt(v.totalExpense)}</td>
                        <td className={S.cellR}>{pct(v.totalExpense, allExp)}</td>
                      </tr>
                    )
                  }) : (
                    <tr><td className={S.cell + ' text-muted-foreground text-center'} colSpan={4}>No vendor expenses recorded</td></tr>
                  )}
                  <tr className={S.totalRow}>
                    <td className={S.totalCell}></td>
                    <td className={S.totalCell}>TOTAL (Top 5)</td>
                    <td className={S.totalCellR}>{fmt(data.vendorSummary.top5ByExpense.reduce((s, v) => s + v.totalExpense, 0))}</td>
                    <td className={S.totalCellR}>--</td>
                  </tr>
                  <tr>
                    <td className={S.cell} colSpan={2}><span className="text-muted-foreground">Total Vendors</span></td>
                    <td className={S.cellR} colSpan={2}>{data.vendorSummary.totalVendors} ({data.vendorSummary.activeVendors} active)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card className="overflow-hidden border border-border">
        <CardHeader className="bg-gradient-to-r from-teal-700 to-teal-600 text-white py-3 px-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2"><BarChart3 className="size-4" /> Monthly Trends (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className={S.table}>
              <thead>
                <tr>
                  <th className={S.header} style={{width: "20%"}}>Month</th>
                  <th className={S.header} style={{width: "20%"}}>Shipments</th>
                  <th className={S.header} style={{width: "20%"}}>{revLabel}</th>
                  <th className={S.header} style={{width: "20%"}}>{expsLabel}</th>
                  <th className={S.header} style={{width: "20%"}}>{profitLabel}</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyTrends.map((t, i) => {
                  const profit = t.revenue - t.expenses
                  return (
                    <tr key={t.month} className={i % 2 === 1 ? S.evenRow : undefined}>
                      <td className={S.cellB}>{new Date(t.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</td>
                      <td className={S.cellR}>{t.shipmentCount}</td>
                      <td className={S.cellR}>{fmt(t.revenue)}</td>
                      <td className={S.cellR}>{fmt(t.expenses)}</td>
                      <td className={S.cellR + (profit >= 0 ? ' text-emerald-600' : ' text-red-600')}>{fmt(profit)}</td>
                    </tr>
                  )
                })}
                <tr className={S.totalRow}>
                  <td className={S.totalCell}>TOTAL</td>
                  <td className={S.totalCellR}>{data.monthlyTrends.reduce((s, t) => s + t.shipmentCount, 0)}</td>
                  <td className={S.totalCellR}>{fmt(data.monthlyTrends.reduce((s, t) => s + t.revenue, 0))}</td>
                  <td className={S.totalCellR}>{fmt(data.monthlyTrends.reduce((s, t) => s + t.expenses, 0))}</td>
                  <td className={S.totalCellR + (data.monthlyTrends.reduce((s, t) => s + t.revenue - t.expenses, 0) >= 0 ? ' text-emerald-600' : ' text-red-600')}>
                    {fmt(data.monthlyTrends.reduce((s, t) => s + t.revenue - t.expenses, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-2 pb-4">
        Generated by FreightFlow ERP &mdash; {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} &bull; {data.companyInfo.name} &bull; All amounts in {cur}
      </div>
    </div>
  )
}
