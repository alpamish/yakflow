'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  ArrowUpDown,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { useNavigationStore } from '@/lib/store'

const CHART_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

interface ProfitRow {
  shipmentId: string
  shipmentNumber: string
  customerName: string
  route: string
  grossRevenue: number
  totalExpense: number
  netProfit: number
  profitMargin: number
}

export function ShipmentProfitability() {
  const { selectShipment } = useNavigationStore()

  const [profitRows, setProfitRows] = useState<ProfitRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'profitMargin' | 'netProfit' | 'grossRevenue'>('profitMargin')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchProfitability = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/shipments?limit=100')
      const json = await res.json()
      if (json.success) {
        const rows: ProfitRow[] = []
        for (const shipment of json.data as { id: string; shipmentNumber: string; customer?: { name: string } | null; originCountry?: string | null; destinationCountry?: string | null }[]) {
          try {
            const pRes = await fetch(`/api/shipments/${shipment.id}/profit`)
            const pJson = await pRes.json()
            if (pJson.success) {
              const data = pJson.data
              const route = data.profitByRoute?.[0]?.route || `${shipment.originCountry || '—'} → ${shipment.destinationCountry || '—'}`
              rows.push({
                shipmentId: shipment.id,
                shipmentNumber: shipment.shipmentNumber,
                customerName: shipment.customer?.name || 'Unknown',
                route,
                grossRevenue: data.grossRevenue || 0,
                totalExpense: data.totalExpense || 0,
                netProfit: data.netProfit || 0,
                profitMargin: data.profitMargin || 0,
              })
            }
          } catch {
            // skip
          }
        }
        setProfitRows(rows)
      }
    } catch (err) {
      console.error('Failed to fetch profitability:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfitability()
  }, [fetchProfitability])

  const filtered = profitRows.filter((r) => {
    if (search && !r.shipmentNumber.toLowerCase().includes(search.toLowerCase()) && !r.customerName.toLowerCase().includes(search.toLowerCase()) && !r.route.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const val = sortBy === 'profitMargin' ? a.profitMargin - b.profitMargin : a[sortBy] - b[sortBy]
    return sortOrder === 'desc' ? -val : val
  })

  const handleSort = (field: 'profitMargin' | 'netProfit' | 'grossRevenue') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const totalProfit = filtered.reduce((sum, r) => sum + r.netProfit, 0)
  const avgMargin = filtered.length > 0 ? filtered.reduce((sum, r) => sum + r.profitMargin, 0) / filtered.length : 0
  const bestRoute = (() => {
    const map: Record<string, { profit: number; count: number }> = {}
    for (const r of filtered) {
      if (!map[r.route]) map[r.route] = { profit: 0, count: 0 }
      map[r.route].profit += r.netProfit
      map[r.route].count++
    }
    const entries = Object.entries(map)
    if (entries.length === 0) return '—'
    return entries.sort((a, b) => b[1].profit - a[1].profit)[0][0]
  })()
  const bestCustomer = (() => {
    const map: Record<string, { profit: number }> = {}
    for (const r of filtered) {
      if (!map[r.customerName]) map[r.customerName] = { profit: 0 }
      map[r.customerName].profit += r.netProfit
    }
    const entries = Object.entries(map)
    if (entries.length === 0) return '—'
    return entries.sort((a, b) => b[1].profit - a[1].profit)[0][0]
  })()

  // Chart data
  const profitByCustomer: Record<string, number> = {}
  for (const r of filtered) {
    profitByCustomer[r.customerName] = (profitByCustomer[r.customerName] || 0) + r.netProfit
  }
  const customerChartData = Object.entries(profitByCustomer)
    .map(([name, profit]) => ({ name, profit: Math.round(profit * 100) / 100 }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10)

  const profitByRoute: Record<string, number> = {}
  for (const r of filtered) {
    profitByRoute[r.route] = (profitByRoute[r.route] || 0) + r.netProfit
  }
  const routeChartData = Object.entries(profitByRoute)
    .map(([name, profit]) => ({ name, profit: Math.round(profit * 100) / 100 }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10)

  // Margin distribution
  const marginBuckets = [
    { name: '< -20%', count: 0 },
    { name: '-20% to -10%', count: 0 },
    { name: '-10% to 0%', count: 0 },
    { name: '0% to 10%', count: 0 },
    { name: '10% to 20%', count: 0 },
    { name: '20% to 30%', count: 0 },
    { name: '> 30%', count: 0 },
  ]
  for (const r of filtered) {
    const m = r.profitMargin
    if (m < -20) marginBuckets[0].count++
    else if (m < -10) marginBuckets[1].count++
    else if (m < 0) marginBuckets[2].count++
    else if (m < 10) marginBuckets[3].count++
    else if (m < 20) marginBuckets[4].count++
    else if (m < 30) marginBuckets[5].count++
    else marginBuckets[6].count++
  }
  const marginChartData = marginBuckets.filter(b => b.count > 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shipment Profitability</h1>
          <p className="text-muted-foreground text-sm">
            Cross-shipment profitability analysis and insights
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${totalProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                <TrendingUp className={`size-5 ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {currencyFormatter.format(totalProfit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-teal-50 dark:bg-teal-950/30 p-2">
                <TrendingUp className="size-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Margin</p>
                <p className={`text-xl font-bold ${avgMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {avgMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Best Route</p>
            <p className="text-lg font-bold truncate">{bestRoute}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Best Customer</p>
            <p className="text-lg font-bold truncate">{bestCustomer}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by shipment, customer, or route..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Profit by Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {customerChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={customerChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: number) => currencyFormatter.format(value)} />
                  <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Profit by Route</CardTitle>
          </CardHeader>
          <CardContent>
            {routeChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={routeChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip formatter={(value: number) => currencyFormatter.format(value)} />
                  <Bar dataKey="profit" name="Profit" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Margin Distribution */}
      {marginChartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Margin Distribution</CardTitle>
            <CardDescription>Number of shipments by profit margin range</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={marginChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="count"
                  nameKey="name"
                  label={({ name, count }) => `${name}: ${count}`}
                >
                  {marginChartData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Profitability Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Shipment Profitability
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({sorted.length} shipments)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <TrendingUp className="size-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No profitability data</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Data will appear when shipments have revenue and expenses
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[calc(100vh-520px)] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Shipment #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('grossRevenue')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Revenue <ArrowUpDown className="size-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('netProfit')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Net Profit <ArrowUpDown className="size-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('profitMargin')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Margin % <ArrowUpDown className="size-3" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((r) => (
                    <TableRow
                      key={r.shipmentId}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => selectShipment(r.shipmentId)}
                    >
                      <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                        {r.shipmentNumber}
                      </TableCell>
                      <TableCell>{r.customerName}</TableCell>
                      <TableCell className="text-sm">{r.route}</TableCell>
                      <TableCell className="text-right">{currencyFormatter.format(r.grossRevenue)}</TableCell>
                      <TableCell className="text-right">{currencyFormatter.format(r.totalExpense)}</TableCell>
                      <TableCell className={`text-right font-medium ${r.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {currencyFormatter.format(r.netProfit)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="secondary"
                          className={r.profitMargin >= 0
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                          }
                        >
                          {r.profitMargin >= 0 ? (
                            <ArrowUpRight className="size-3 mr-1" />
                          ) : (
                            <ArrowDownRight className="size-3 mr-1" />
                          )}
                          {Math.abs(r.profitMargin).toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
