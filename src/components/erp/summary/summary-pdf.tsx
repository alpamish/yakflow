import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 8,
  },
  titleBlock: {
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#0f766e',
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f766e',
  },
  subtitle: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  section: {
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#0f766e',
    padding: '5 8',
    marginBottom: 0,
  },
  table: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#0f766e',
  },
  headerCell: {
    padding: '4 6',
    color: '#fff',
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  rowEven: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  cell: {
    padding: '3 6',
    fontSize: 7,
    color: '#111827',
  },
  cellBold: {
    padding: '3 6',
    fontSize: 7,
    fontWeight: 'bold',
    color: '#111827',
  },
  cellRight: {
    padding: '3 6',
    fontSize: 7,
    color: '#111827',
    textAlign: 'right',
  },
  cellRightBold: {
    padding: '3 6',
    fontSize: 7,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#e6f7f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  totalCell: {
    padding: '4 6',
    fontSize: 7,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalCellRight: {
    padding: '4 6',
    fontSize: 7,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'right',
  },
  subHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
  },
  subHeaderCell: {
    padding: '2 6',
    fontSize: 6,
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 7,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
})

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

const fmt = (n: number, sym: string) => {
  if (Math.abs(n) >= 10000) return sym + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (Math.abs(n) >= 1) return sym + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return sym + n.toFixed(2)
}

const pct = (n: number, total: number) => total > 0 ? ((n / total) * 100).toFixed(1) + '%' : '0%'

interface SummaryPDFProps {
  data: {
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
}

function Table({ columns, data }: { columns: { key: string; label: string; width: string; align?: string; bold?: boolean }[]; data: (string | number)[][] }) {
  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        {columns.map((col, i) => (
          <Text key={i} style={[styles.headerCell, { width: col.width }, col.align === 'right' ? { textAlign: 'right' } : {}]}>{col.label}</Text>
        ))}
      </View>
      {data.map((row, ri) => (
        <View key={ri} style={ri % 2 === 0 ? styles.row : styles.rowEven}>
          {row.map((cell, ci) => (
            <Text key={ci} style={[
              typeof cell === 'string' && (cell.startsWith('TOTAL') || cell === cell.toUpperCase() && cell.length > 3) ? styles.cellBold : styles.cell,
              { width: columns[ci].width },
              columns[ci].align === 'right' ? styles.cellRight : {},
            ]}>{cell}</Text>
          ))}
        </View>
      ))}
    </View>
  )
}

function TableRow({ columns, cells, isTotal, isSub }: { columns: { width: string; align?: string; bold?: boolean }[]; cells: (string | number)[]; isTotal?: boolean; isSub?: boolean }) {
  const rowStyle = isTotal ? styles.totalRow : isSub ? styles.subHeaderRow : undefined
  return (
    <View style={rowStyle || styles.row}>
      {cells.map((cell, i) => (
        <Text key={i} style={[
          isTotal ? styles.totalCell : isSub ? styles.subHeaderCell : styles.cell,
          { width: columns[i].width },
          columns[i].align === 'right' ? (isTotal ? styles.totalCellRight : styles.cellRight) : {},
        ]}>{cell}</Text>
      ))}
    </View>
  )
}

export function SummaryPDF({ data }: SummaryPDFProps) {
  const cur = data.companyInfo.baseCurrency || 'USD'
  const sym = getCurrencySymbol(cur)
  const totalRevenue = data.shipmentSummary.totalRevenue + data.voyageSummary.totalRevenue
  const totalExpenses = data.shipmentSummary.totalExpenses + data.voyageSummary.totalExpenses
  const totalProfit = totalRevenue - totalExpenses
  const grandExpense = data.expenseBreakdown.reduce((s, e) => s + e.total, 0)
  const grandRevenue = data.revenueBreakdown.reduce((s, r) => s + r.total, 0)

  const financialColumns = [
    { key: 'cat', label: 'Category', width: '34%' },
    { key: 'ship', label: 'Shipment Ops', width: '22%', align: 'right' as const },
    { key: 'voy', label: 'Voyage Finance', width: '22%', align: 'right' as const },
    { key: 'combined', label: 'Combined Total', width: '22%', align: 'right' as const },
  ]

  const expenseColumns = [
    { key: 'type', label: 'Expense Type', width: '42%' },
    { key: 'amount', label: `Amount (${cur})`, width: '25%', align: 'right' as const },
    { key: 'pct', label: '% of Total', width: '18%', align: 'right' as const },
    { key: 'bar', label: '', width: '15%' },
  ]

  const revenueColumns = [
    { key: 'type', label: 'Revenue Type', width: '42%' },
    { key: 'amount', label: `Amount (${cur})`, width: '25%', align: 'right' as const },
    { key: 'pct', label: '% of Total', width: '18%', align: 'right' as const },
    { key: 'bar', label: '', width: '15%' },
  ]

  const custColumns = [
    { key: 'no', label: 'No.', width: '10%' },
    { key: 'name', label: 'Customer', width: '40%' },
    { key: 'rev', label: `Revenue (${cur})`, width: '30%', align: 'right' as const },
    { key: 'share', label: 'Share', width: '20%', align: 'right' as const },
  ]

  const monthColumns = [
    { key: 'month', label: 'Month', width: '20%' },
    { key: 'ship', label: 'Shipments', width: '20%', align: 'right' as const },
    { key: 'rev', label: `Revenue (${cur})`, width: '20%', align: 'right' as const },
    { key: 'exp', label: `Expenses (${cur})`, width: '20%', align: 'right' as const },
    { key: 'profit', label: `Net Profit (${cur})`, width: '20%', align: 'right' as const },
  ]

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>ERP Summary Report</Text>
          <Text style={styles.subtitle}>{data.companyInfo.name} &mdash; Comprehensive overview</Text>
        </View>

        {/* Combined Financial Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Combined Financial Overview</Text>
          <Table columns={financialColumns} data={[
            ['Gross Revenue', fmt(data.shipmentSummary.totalRevenue, sym), fmt(data.voyageSummary.totalRevenue, sym), fmt(totalRevenue, sym)],
            ['Total Expenses', fmt(data.shipmentSummary.totalExpenses, sym), fmt(data.voyageSummary.totalExpenses, sym), fmt(totalExpenses, sym)],
            ['Net Profit', fmt(data.shipmentSummary.netProfit, sym), fmt(data.voyageSummary.netProfit, sym), fmt(totalProfit, sym)],
            ['Profit Margin',
              data.shipmentSummary.totalRevenue > 0 ? ((data.shipmentSummary.netProfit / data.shipmentSummary.totalRevenue) * 100).toFixed(1) + '%' : '--',
              data.voyageSummary.totalRevenue > 0 ? ((data.voyageSummary.netProfit / data.voyageSummary.totalRevenue) * 100).toFixed(1) + '%' : '--',
              totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) + '%' : '--',
            ],
          ]} />
        </View>

        {/* Shipment Operations */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Shipment Operations</Text>
          <Table columns={[{ key: 'm', label: 'Metric', width: '60%' }, { key: 'v', label: 'Value', width: '40%', align: 'right' }]} data={[
            ['Total Shipments', String(data.shipmentSummary.totalShipments)],
            ['Shipment Net Profit', fmt(data.shipmentSummary.netProfit, sym)],
          ]} />
        </View>

        {/* Voyage Finance */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Voyage Finance</Text>
          <Table columns={[{ key: 'm', label: 'Metric', width: '60%' }, { key: 'v', label: 'Value', width: '40%', align: 'right' }]} data={[
            ['Total Voyages', String(data.voyageSummary.totalVoyages)],
            ['Total TEUs', data.voyageSummary.totalTEUs.toLocaleString()],
            ['Avg Utilization', data.voyageSummary.avgUtilization.toFixed(1) + '%'],
            ['Voyage Revenue', fmt(data.voyageSummary.totalRevenue, sym)],
            ['Voyage Expenses', fmt(data.voyageSummary.totalExpenses, sym)],
            ['Voyage Net Profit', fmt(data.voyageSummary.netProfit, sym)],
          ]} />
        </View>

        {/* Expense Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Expense Breakdown</Text>
          <Table columns={expenseColumns} data={[
            ...data.expenseBreakdown.map((item, i) => [
              EXPENSE_LABELS[item.type] || item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              fmt(item.total, sym),
              pct(item.total, grandExpense),
              '',
            ] as (string | number)[]),
            ['TOTAL EXPENSES', fmt(grandExpense, sym), '100%', ''],
          ]} />
        </View>

        {/* Revenue Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Revenue Breakdown</Text>
          <Table columns={revenueColumns} data={[
            ...data.revenueBreakdown.map((item, i) => [
              REVENUE_LABELS[item.type] || item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              fmt(item.total, sym),
              pct(item.total, grandRevenue),
              '',
            ] as (string | number)[]),
            ['TOTAL REVENUE', fmt(grandRevenue, sym), '100%', ''],
          ]} />
        </View>

        {/* Container Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Container Summary</Text>
          <Table columns={[{ key: 'm', label: 'Metric', width: '50%' }, { key: 'c', label: 'Count', width: '25%', align: 'right' }, { key: 's', label: 'Share', width: '25%', align: 'right' }]} data={[
            ['Total Containers', String(data.containerSummary.totalContainers), '100%'],
            ...Object.entries(data.containerSummary.byType).map(([k, v]) => [`${k}' Container`, String(v), pct(v, data.containerSummary.totalContainers)]),
            ...Object.entries(data.containerSummary.byStatus).map(([k, v]) => [STATUS_LABELS[k] || k.replace(/_/g, ' '), String(v), pct(v, data.containerSummary.totalContainers)]),
            ['Reefer Units', String(data.containerSummary.reeferCount), pct(data.containerSummary.reeferCount, data.containerSummary.totalContainers)],
            ['Special Units', String(data.containerSummary.specialUnitsCount), pct(data.containerSummary.specialUnitsCount, data.containerSummary.totalContainers)],
          ]} />
        </View>

        {/* Financial Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Financial Summary</Text>
          <Table columns={[{ key: 'm', label: 'Metric', width: '60%' }, { key: 'v', label: 'Value', width: '40%', align: 'right' }]} data={[
            ['Total Invoices', String(data.financialSummary.totalInvoices)],
            ['Subtotal', fmt(data.financialSummary.totalSubtotal, sym)],
            ['Tax', fmt(data.financialSummary.totalTax, sym)],
            ['Total Invoice Amount', fmt(data.financialSummary.totalInvoiceAmount, sym)],
            ['Total Payments', String(data.financialSummary.totalPayments)],
            ['Total Payment Amount', fmt(data.financialSummary.totalPaymentAmount, sym)],
            ['Accounts Receivable', fmt(data.financialSummary.accountsReceivable, sym)],
            ['Accounts Payable', fmt(data.financialSummary.accountsPayable, sym)],
            ['Net Receivable', fmt(data.financialSummary.accountsReceivable - data.financialSummary.accountsPayable, sym)],
            ...Object.entries(data.financialSummary.byCurrency).flatMap(([code, info]) => [
              [`${code} — ${info.count} invoice${info.count !== 1 ? 's' : ''}`, `${getCurrencySymbol(code)}${info.totalAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`],
            ]),
          ]} />
        </View>

        {/* Top 5 Customers */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Top 5 Customers by Revenue</Text>
          <Table columns={custColumns} data={[
            ...data.customerSummary.top5ByRevenue.map((c, i) => [
              String(i + 1),
              c.customerName,
              fmt(c.totalRevenue, sym),
              pct(c.totalRevenue, data.customerSummary.top5ByRevenue.reduce((s, x) => s + x.totalRevenue, 0)),
            ] as (string | number)[]),
            ['', 'TOTAL (Top 5)', fmt(data.customerSummary.top5ByRevenue.reduce((s, c) => s + c.totalRevenue, 0), sym), '--'],
            ['Total Customers:', `${data.customerSummary.totalCustomers} (${data.customerSummary.activeCustomers} active)`, '', ''],
          ]} />
        </View>

        {/* Top 5 Vendors */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Top 5 Vendors by Expense</Text>
          <Table columns={[
            { key: 'no', label: 'No.', width: '10%' },
            { key: 'name', label: 'Vendor', width: '40%' },
            { key: 'exp', label: `Expense (${cur})`, width: '30%', align: 'right' as const },
            { key: 'share', label: 'Share', width: '20%', align: 'right' as const },
          ]} data={[
            ...data.vendorSummary.top5ByExpense.map((v, i) => [
              String(i + 1),
              v.vendorName,
              fmt(v.totalExpense, sym),
              pct(v.totalExpense, data.vendorSummary.top5ByExpense.reduce((s, x) => s + x.totalExpense, 0)),
            ] as (string | number)[]),
            ['', 'TOTAL (Top 5)', fmt(data.vendorSummary.top5ByExpense.reduce((s, v) => s + v.totalExpense, 0), sym), '--'],
            ['Total Vendors:', `${data.vendorSummary.totalVendors} (${data.vendorSummary.activeVendors} active)`, '', ''],
          ]} />
        </View>

        {/* Monthly Trends */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Monthly Trends (Last 6 Months)</Text>
          <Table columns={monthColumns} data={[
            ...data.monthlyTrends.map(t => [
              new Date(t.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
              String(t.shipmentCount),
              fmt(t.revenue, sym),
              fmt(t.expenses, sym),
              fmt(t.revenue - t.expenses, sym),
            ] as (string | number)[]),
            [
              'TOTAL',
              String(data.monthlyTrends.reduce((s, t) => s + t.shipmentCount, 0)),
              fmt(data.monthlyTrends.reduce((s, t) => s + t.revenue, 0), sym),
              fmt(data.monthlyTrends.reduce((s, t) => s + t.expenses, 0), sym),
              fmt(data.monthlyTrends.reduce((s, t) => s + t.revenue - t.expenses, 0), sym),
            ],
          ]} />
        </View>

        <Text style={styles.footer}>
          Generated by FreightFlow ERP — {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} • {data.companyInfo.name} • All amounts in {cur}
        </Text>
      </Page>
    </Document>
  )
}
