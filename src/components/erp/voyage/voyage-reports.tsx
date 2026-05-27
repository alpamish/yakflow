'use client'

import React, { useState, useEffect } from 'react'
import {
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Printer,
  Calendar,
  Filter,
  Download,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const REPORT_TYPES = [
  { value: 'voyage_pl', label: 'Voyage P&L', description: 'Profit and loss statement per voyage' },
  { value: 'vessel_profitability', label: 'Vessel Profitability', description: 'Financial performance by vessel' },
  { value: 'route_profitability', label: 'Route Profitability', description: 'Financial performance by route' },
  { value: 'teu_analysis', label: 'TEU Analysis', description: 'TEU utilization and distribution analysis' },
  { value: 'monthly_performance', label: 'Monthly Performance', description: 'Month-over-month voyage performance' },
  { value: 'expense_analysis', label: 'Expense Analysis', description: 'Detailed expense breakdown and trends' },
  { value: 'revenue_analysis', label: 'Revenue Analysis', description: 'Revenue streams and trends analysis' },
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface ReportRow {
  [key: string]: string | number
}

export function VoyageReports() {
  const [reportType, setReportType] = useState('voyage_pl')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportRow[]>([])
  const [reportHeaders, setReportHeaders] = useState<string[]>([])
  const [generated, setGenerated] = useState(false)

  const generateReport = async () => {
    setLoading(true)
    setGenerated(true)
    try {
      const res = await fetch('/api/voyages?limit=100')
      const data = await res.json()
      if (!data.success) return

      const voyages = data.data || []

      // Fetch profit data for all voyages
      const voyagesWithProfit = await Promise.all(
        voyages.map(async (v: { id: string; voyageNumber: string; vesselName: string; sailingRoute: string | null; departurePort: string | null; arrivalPort: string | null; etd: string | null; status: string; totalRevenue: number; totalExpenses: number; teuSummary: { totalTEUs: number; loadedTEUs: number; teuUtilization: number | null } | null }) => {
          try {
            const [profitRes, detailRes] = await Promise.all([
              fetch(`/api/voyages/${v.id}/profit`),
              fetch(`/api/voyages/${v.id}`),
            ])
            const profitData = await profitRes.json()
            const detailData = await detailRes.json()
            return {
              ...v,
              profit: profitData.success ? profitData.data : null,
              detail: detailData.success ? detailData.data : null,
            }
          } catch {
            return { ...v, profit: null, detail: null }
          }
        })
      )

      // Filter by date range if specified
      let filtered = voyagesWithProfit
      if (dateFrom) {
        filtered = filtered.filter((v: { etd: string | null }) => v.etd && new Date(v.etd) >= new Date(dateFrom))
      }
      if (dateTo) {
        filtered = filtered.filter((v: { etd: string | null }) => v.etd && new Date(v.etd) <= new Date(dateTo))
      }

      // Generate report based on type
      switch (reportType) {
        case 'voyage_pl': {
          setReportHeaders(['Voyage #', 'Vessel', 'Revenue', 'Expenses', 'Net Profit', 'Margin %'])
          setReportData(filtered.map((v: { voyageNumber: string; vesselName: string; totalRevenue: number; totalExpenses: number; profit: { netProfit: number; profitMargin: number } | null }) => ({
            'Voyage #': v.voyageNumber,
            'Vessel': v.vesselName,
            'Revenue': formatCurrency(v.totalRevenue),
            'Expenses': formatCurrency(v.totalExpenses),
            'Net Profit': formatCurrency(v.profit?.netProfit || (v.totalRevenue - v.totalExpenses)),
            'Margin %': `${(v.profit?.profitMargin || 0).toFixed(1)}%`,
          })))
          break
        }
        case 'vessel_profitability': {
          setReportHeaders(['Vessel', 'Voyages', 'Total Revenue', 'Total Expenses', 'Net Profit', 'Avg Margin %'])
          const vesselMap: Record<string, { count: number; revenue: number; expenses: number; profit: number; marginSum: number }> = {}
          filtered.forEach((v: { vesselName: string; totalRevenue: number; totalExpenses: number; profit: { netProfit: number; profitMargin: number } | null }) => {
            if (!vesselMap[v.vesselName]) vesselMap[v.vesselName] = { count: 0, revenue: 0, expenses: 0, profit: 0, marginSum: 0 }
            vesselMap[v.vesselName].count++
            vesselMap[v.vesselName].revenue += v.totalRevenue
            vesselMap[v.vesselName].expenses += v.totalExpenses
            vesselMap[v.vesselName].profit += v.profit?.netProfit || 0
            vesselMap[v.vesselName].marginSum += v.profit?.profitMargin || 0
          })
          setReportData(Object.entries(vesselMap).map(([name, d]) => ({
            'Vessel': name,
            'Voyages': String(d.count),
            'Total Revenue': formatCurrency(d.revenue),
            'Total Expenses': formatCurrency(d.expenses),
            'Net Profit': formatCurrency(d.profit),
            'Avg Margin %': `${(d.marginSum / d.count).toFixed(1)}%`,
          })))
          break
        }
        case 'route_profitability': {
          setReportHeaders(['Route', 'Voyages', 'Total Revenue', 'Total Expenses', 'Net Profit', 'Avg Margin %'])
          const routeMap: Record<string, { count: number; revenue: number; expenses: number; profit: number; marginSum: number }> = {}
          filtered.forEach((v: { sailingRoute: string | null; totalRevenue: number; totalExpenses: number; profit: { netProfit: number; profitMargin: number } | null }) => {
            const route = v.sailingRoute || 'Unknown'
            if (!routeMap[route]) routeMap[route] = { count: 0, revenue: 0, expenses: 0, profit: 0, marginSum: 0 }
            routeMap[route].count++
            routeMap[route].revenue += v.totalRevenue
            routeMap[route].expenses += v.totalExpenses
            routeMap[route].profit += v.profit?.netProfit || 0
            routeMap[route].marginSum += v.profit?.profitMargin || 0
          })
          setReportData(Object.entries(routeMap).map(([name, d]) => ({
            'Route': name,
            'Voyages': String(d.count),
            'Total Revenue': formatCurrency(d.revenue),
            'Total Expenses': formatCurrency(d.expenses),
            'Net Profit': formatCurrency(d.profit),
            'Avg Margin %': `${(d.marginSum / d.count).toFixed(1)}%`,
          })))
          break
        }
        case 'teu_analysis': {
          setReportHeaders(['Voyage #', 'Vessel', 'Total TEUs', 'Loaded', 'Empty', 'Utilization %', '20ft', '40ft', 'Reefer'])
          setReportData(filtered.map((v: { voyageNumber: string; vesselName: string; teuSummary: { totalTEUs: number; loadedTEUs: number; teuUtilization: number | null } | null; detail: { teuRecords: Array<{ totalTEUs: number; loadedTEUs: number; emptyTEUs: number; twentyFoot: number; fortyFoot: number; reeferUnits: number; teuUtilization: number | null }> } | null }) => {
            const teu = v.teuSummary
            const latestRec = v.detail?.teuRecords?.[0]
            return {
              'Voyage #': v.voyageNumber,
              'Vessel': v.vesselName,
              'Total TEUs': String(teu?.totalTEUs || 0),
              'Loaded': String(teu?.loadedTEUs || 0),
              'Empty': String((teu?.totalTEUs || 0) - (teu?.loadedTEUs || 0)),
              'Utilization %': `${(teu?.teuUtilization || 0).toFixed(1)}%`,
              '20ft': String(latestRec?.twentyFoot || 0),
              '40ft': String(latestRec?.fortyFoot || 0),
              'Reefer': String(latestRec?.reeferUnits || 0),
            }
          }))
          break
        }
        case 'monthly_performance': {
          setReportHeaders(['Month', 'Voyages', 'Revenue', 'Expenses', 'Net Profit', 'Avg Margin %'])
          const monthMap: Record<string, { count: number; revenue: number; expenses: number; profit: number; marginSum: number }> = {}
          filtered.forEach((v: { etd: string | null; totalRevenue: number; totalExpenses: number; profit: { netProfit: number; profitMargin: number } | null }) => {
            const month = v.etd ? new Date(v.etd).toISOString().slice(0, 7) : 'Unknown'
            if (!monthMap[month]) monthMap[month] = { count: 0, revenue: 0, expenses: 0, profit: 0, marginSum: 0 }
            monthMap[month].count++
            monthMap[month].revenue += v.totalRevenue
            monthMap[month].expenses += v.totalExpenses
            monthMap[month].profit += v.profit?.netProfit || 0
            monthMap[month].marginSum += v.profit?.profitMargin || 0
          })
          setReportData(Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).map(([name, d]) => ({
            'Month': name,
            'Voyages': String(d.count),
            'Revenue': formatCurrency(d.revenue),
            'Expenses': formatCurrency(d.expenses),
            'Net Profit': formatCurrency(d.profit),
            'Avg Margin %': `${(d.marginSum / d.count).toFixed(1)}%`,
          })))
          break
        }
        case 'expense_analysis': {
          setReportHeaders(['Voyage #', 'Vessel', 'Ocean Freight', 'Port Charges', 'Fuel Costs', 'Terminal Handling', 'Other'])
          setReportData(filtered.map((v: { voyageNumber: string; vesselName: string; profit: { expenseByType: Record<string, number> } | null }) => {
            const expByType = v.profit?.expenseByType || {}
            return {
              'Voyage #': v.voyageNumber,
              'Vessel': v.vesselName,
              'Ocean Freight': formatCurrency(expByType.ocean_freight || 0),
              'Port Charges': formatCurrency(expByType.port_charges || 0),
              'Fuel Costs': formatCurrency(expByType.fuel_costs || 0),
              'Terminal Handling': formatCurrency(expByType.terminal_handling || 0),
              'Other': formatCurrency(
                Object.entries(expByType)
                  .filter(([k]) => !['ocean_freight', 'port_charges', 'fuel_costs', 'terminal_handling'].includes(k))
                  .reduce((s, [, v]) => s + v, 0)
              ),
            }
          }))
          break
        }
        case 'revenue_analysis': {
          setReportHeaders(['Voyage #', 'Vessel', 'Freight Income', 'Slot Revenue', 'Surcharges', 'Other'])
          setReportData(filtered.map((v: { voyageNumber: string; vesselName: string; profit: { revenueByType: Record<string, number> } | null }) => {
            const revByType = v.profit?.revenueByType || {}
            return {
              'Voyage #': v.voyageNumber,
              'Vessel': v.vesselName,
              'Freight Income': formatCurrency(revByType.freight_income || 0),
              'Slot Revenue': formatCurrency(revByType.slot_revenue || 0),
              'Surcharges': formatCurrency(revByType.surcharges || 0),
              'Other': formatCurrency(
                Object.entries(revByType)
                  .filter(([k]) => !['freight_income', 'slot_revenue', 'surcharges'].includes(k))
                  .reduce((s, [, v]) => s + v, 0)
              ),
            }
          }))
          break
        }
      }
    } catch {
      console.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = (format: string) => {
    if (format === 'print') {
      window.print()
      return
    }

    // Generate CSV for both Excel and PDF (simplified)
    if (reportData.length === 0) return
    const csvContent = [
      reportHeaders.join(','),
      ...reportData.map(row => reportHeaders.map(h => `"${row[h]}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `voyage-${reportType}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  const selectedReport = REPORT_TYPES.find(r => r.value === reportType)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl p-3 bg-amber-50 dark:bg-amber-950/30">
          <FileBarChart className="size-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Voyage Reports</h1>
          <p className="text-muted-foreground">Generate and export voyage performance reports</p>
        </div>
      </div>

      <Separator />

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Configuration</CardTitle>
          <CardDescription>Select report type and filters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {selectedReport && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{selectedReport.label}:</span> {selectedReport.description}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={generateReport}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileBarChart className="size-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
            {generated && reportData.length > 0 && (
              <>
                <Button variant="outline" onClick={() => handleExport('excel')}>
                  <FileSpreadsheet className="size-4 mr-2" />
                  Export Excel
                </Button>
                <Button variant="outline" onClick={() => handleExport('pdf')}>
                  <FileText className="size-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" onClick={() => handleExport('print')}>
                  <Printer className="size-4 mr-2" />
                  Print
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      {generated && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {selectedReport?.label || 'Report'} Preview
                </CardTitle>
                <CardDescription>
                  {reportData.length} record{reportData.length !== 1 ? 's' : ''}
                  {dateFrom && ` | From: ${formatDate(dateFrom)}`}
                  {dateTo && ` | To: ${formatDate(dateTo)}`}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                {reportType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : reportData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileBarChart className="size-8 mx-auto mb-2 opacity-40" />
                <p>No data found for the selected filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      {reportHeaders.map(header => (
                        <TableHead key={header} className="font-semibold whitespace-nowrap">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((row, i) => (
                      <TableRow key={i}>
                        {reportHeaders.map(header => (
                          <TableCell key={header} className="whitespace-nowrap text-sm">
                            {row[header]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Access Report Cards */}
      {!generated && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_TYPES.map(r => (
            <Card
              key={r.value}
              className="hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => { setReportType(r.value); generateReport() }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2 bg-amber-50 dark:bg-amber-950/30 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors">
                    <FileBarChart className="size-4 text-amber-600" />
                  </div>
                  <CardTitle className="text-base">{r.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{r.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
