'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  FileBarChart,
  Download,
  FileText,
  Printer,
  Search,
} from 'lucide-react'
import { format } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

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

interface ShipmentSummary {
  id: string
  shipmentNumber: string
  direction: string
  transportMode: string
  customer: { name: string } | null
  originCountry: string | null
  destinationCountry: string | null
  status: string
  totalRevenues: number
  totalExpenses: number
  containerCount: number
}

const statusLabels: Record<string, string> = {
  draft: 'Draft', booked: 'Booked', loading: 'Loading', in_transit: 'In Transit',
  arrived: 'Arrived', customs_clearance: 'Customs', delivered: 'Delivered', cancelled: 'Cancelled',
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  booked: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  loading: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  in_transit: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
  arrived: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  customs_clearance: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

export function ShipmentReports() {
  const [reportType, setReportType] = useState('shipment_summary')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [data, setData] = useState<ShipmentSummary[]>([])
  const [loading, setLoading] = useState(false)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const res = await fetch(`/api/shipments?${params}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch report:', err)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handlePrint = () => {
    window.print()
  }

  const renderReportTable = () => {
    if (loading) {
      return (
        <div className="p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      )
    }

    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <FileBarChart className="size-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No data for this report</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Try adjusting the date range or create shipments first
          </p>
        </div>
      )
    }

    switch (reportType) {
      case 'shipment_summary':
        return (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment #</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Transport</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Containers</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((s) => {
                  const profit = s.totalRevenues - s.totalExpenses
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.shipmentNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{s.direction}</Badge>
                      </TableCell>
                      <TableCell className="capitalize">{s.transportMode}</TableCell>
                      <TableCell>{s.customer?.name || '—'}</TableCell>
                      <TableCell className="text-sm">
                        {s.originCountry || '—'} → {s.destinationCountry || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[s.status] || ''}>
                          {statusLabels[s.status] || s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{s.containerCount ?? 0}</TableCell>
                      <TableCell className="text-right">{currencyFormatter.format(s.totalRevenues)}</TableCell>
                      <TableCell className="text-right">{currencyFormatter.format(s.totalExpenses)}</TableCell>
                      <TableCell className={`text-right font-medium ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {currencyFormatter.format(profit)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )

      case 'profitability':
        return (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Net Profit</TableHead>
                  <TableHead className="text-right">Margin %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((s) => {
                  const profit = s.totalRevenues - s.totalExpenses
                  const margin = s.totalRevenues > 0 ? (profit / s.totalRevenues) * 100 : 0
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.shipmentNumber}</TableCell>
                      <TableCell>{s.customer?.name || '—'}</TableCell>
                      <TableCell className="text-sm">
                        {s.originCountry || '—'} → {s.destinationCountry || '—'}
                      </TableCell>
                      <TableCell className="text-right">{currencyFormatter.format(s.totalRevenues)}</TableCell>
                      <TableCell className="text-right">{currencyFormatter.format(s.totalExpenses)}</TableCell>
                      <TableCell className={`text-right font-medium ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {currencyFormatter.format(profit)}
                      </TableCell>
                      <TableCell className={`text-right ${margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {margin.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )

      case 'customer_ledger': {
        const customerMap: Record<string, { name: string; shipments: number; revenue: number; expenses: number }> = {}
        for (const s of data) {
          const key = s.customer?.name || 'Unknown'
          if (!customerMap[key]) customerMap[key] = { name: key, shipments: 0, revenue: 0, expenses: 0 }
          customerMap[key].shipments++
          customerMap[key].revenue += s.totalRevenues
          customerMap[key].expenses += s.totalExpenses
        }
        const customerData = Object.values(customerMap).sort((a, b) => b.revenue - a.revenue)
        return (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-center">Shipments</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Net Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerData.map((c) => (
                  <TableRow key={c.name}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-center">{c.shipments}</TableCell>
                    <TableCell className="text-right">{currencyFormatter.format(c.revenue)}</TableCell>
                    <TableCell className="text-right">{currencyFormatter.format(c.expenses)}</TableCell>
                    <TableCell className={`text-right font-medium ${c.revenue - c.expenses >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {currencyFormatter.format(c.revenue - c.expenses)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      }

      case 'route_profitability': {
        const routeMap: Record<string, { route: string; shipments: number; revenue: number; expenses: number }> = {}
        for (const s of data) {
          const route = `${s.originCountry || '—'} → ${s.destinationCountry || '—'}`
          if (!routeMap[route]) routeMap[route] = { route, shipments: 0, revenue: 0, expenses: 0 }
          routeMap[route].shipments++
          routeMap[route].revenue += s.totalRevenues
          routeMap[route].expenses += s.totalExpenses
        }
        const routeData = Object.values(routeMap).sort((a, b) => (b.revenue - b.expenses) - (a.revenue - a.expenses))
        return (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead className="text-center">Shipments</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Net Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routeData.map((r) => (
                  <TableRow key={r.route}>
                    <TableCell className="font-medium">{r.route}</TableCell>
                    <TableCell className="text-center">{r.shipments}</TableCell>
                    <TableCell className="text-right">{currencyFormatter.format(r.revenue)}</TableCell>
                    <TableCell className="text-right">{currencyFormatter.format(r.expenses)}</TableCell>
                    <TableCell className={`text-right font-medium ${r.revenue - r.expenses >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {currencyFormatter.format(r.revenue - r.expenses)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      }

      case 'country_analysis': {
        const countryMap: Record<string, { country: string; asOrigin: number; asDestination: number; revenue: number }> = {}
        for (const s of data) {
          if (s.originCountry) {
            if (!countryMap[s.originCountry]) countryMap[s.originCountry] = { country: s.originCountry, asOrigin: 0, asDestination: 0, revenue: 0 }
            countryMap[s.originCountry].asOrigin++
            countryMap[s.originCountry].revenue += s.totalRevenues
          }
          if (s.destinationCountry) {
            if (!countryMap[s.destinationCountry]) countryMap[s.destinationCountry] = { country: s.destinationCountry, asOrigin: 0, asDestination: 0, revenue: 0 }
            countryMap[s.destinationCountry].asDestination++
            countryMap[s.destinationCountry].revenue += s.totalRevenues
          }
        }
        const countryData = Object.values(countryMap).sort((a, b) => b.revenue - a.revenue)
        return (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-center">As Origin</TableHead>
                  <TableHead className="text-center">As Destination</TableHead>
                  <TableHead className="text-right">Associated Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countryData.map((c) => (
                  <TableRow key={c.country}>
                    <TableCell className="font-medium">{c.country}</TableCell>
                    <TableCell className="text-center">{c.asOrigin}</TableCell>
                    <TableCell className="text-center">{c.asDestination}</TableCell>
                    <TableCell className="text-right">{currencyFormatter.format(c.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      }

      case 'container_utilization':
        return (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-center">Containers</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Revenue/Container</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.shipmentNumber}</TableCell>
                    <TableCell>{s.customer?.name || '—'}</TableCell>
                    <TableCell className="text-center">{s.containerCount ?? 0}</TableCell>
                    <TableCell className="text-sm">
                      {s.originCountry || '—'} → {s.destinationCountry || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[s.status] || ''}>
                        {statusLabels[s.status] || s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {(s.containerCount ?? 0) > 0
                        ? currencyFormatter.format(s.totalRevenues / s.containerCount)
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )

      default:
        return (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.shipmentNumber}</TableCell>
                    <TableCell>{s.customer?.name || '—'}</TableCell>
                    <TableCell className="text-sm">
                      {s.originCountry || '—'} → {s.destinationCountry || '—'}
                    </TableCell>
                    <TableCell className="text-right">{currencyFormatter.format(s.totalRevenues)}</TableCell>
                    <TableCell className="text-right">{currencyFormatter.format(s.totalExpenses)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[s.status] || ''}>
                        {statusLabels[s.status] || s.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shipment Reports</h1>
        <p className="text-muted-foreground text-sm">
          Generate and view comprehensive shipment operation reports
        </p>
      </div>

      {/* Report Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((rt) => (
                  <SelectItem key={rt.value} value={rt.value}>
                    {rt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={fetchReport}
            >
              <Search className="size-4 mr-2" />
              Generate
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" title="Export Excel (placeholder)">
                <Download className="size-4 mr-1" />
                Excel
              </Button>
              <Button variant="outline" size="sm" className="flex-1" title="Export PDF (placeholder)">
                <FileText className="size-4 mr-1" />
                PDF
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={handlePrint}>
                <Printer className="size-4 mr-1" />
                Print
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Title */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {reportTypes.find(r => r.value === reportType)?.label || 'Report'}
              </CardTitle>
              <CardDescription>
                {startDate && endDate
                  ? `${format(new Date(startDate), 'MMM dd, yyyy')} — ${format(new Date(endDate), 'MMM dd, yyyy')}`
                  : 'All dates'}
                {' '}&middot; {data.length} records
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
              <FileBarChart className="size-3 mr-1" />
              Report
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {renderReportTable()}
        </CardContent>
      </Card>
    </div>
  )
}
