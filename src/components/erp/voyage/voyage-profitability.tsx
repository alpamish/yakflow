'use client'

import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  Search,
  Filter,
  Anchor,
  DollarSign,
  ArrowUpDown,
  Ship,
  MapPin,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { useNavigationStore } from '@/lib/store'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface ProfitVoyage {
  id: string
  voyageNumber: string
  vesselName: string
  sailingRoute: string | null
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  profitPerTEU: number
  revenuePerTEU: number
  expensePerTEU: number
}

export function VoyageProfitability() {
  const { selectVoyage } = useNavigationStore()
  const [voyages, setVoyages] = useState<ProfitVoyage[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'margin' | 'profitPerTEU' | 'netProfit'>('netProfit')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch('/api/voyages?limit=100')
        const data = await res.json()
        if (data.success) {
          // Fetch profit for each voyage
          const profitData = await Promise.all(
            (data.data || []).map(async (v: { id: string; voyageNumber: string; vesselName: string; sailingRoute: string | null; totalRevenue: number; totalExpenses: number }) => {
              try {
                const profitRes = await fetch(`/api/voyages/${v.id}/profit`)
                const profitJson = await profitRes.json()
                if (profitJson.success) {
                  return {
                    id: v.id,
                    voyageNumber: v.voyageNumber,
                    vesselName: v.vesselName,
                    sailingRoute: v.sailingRoute,
                    totalRevenue: profitJson.data.totalRevenue,
                    totalExpenses: profitJson.data.totalExpense,
                    netProfit: profitJson.data.netProfit,
                    profitMargin: profitJson.data.profitMargin,
                    profitPerTEU: profitJson.data.profitPerTEU,
                    revenuePerTEU: profitJson.data.revenuePerTEU,
                    expensePerTEU: profitJson.data.expensePerTEU,
                  }
                }
                return null
              } catch {
                return null
              }
            })
          )
          setVoyages(profitData.filter(Boolean) as ProfitVoyage[])
        }
      } catch {
        console.error('Failed to fetch voyages')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter
  const filtered = voyages.filter(v => {
    if (search && !v.voyageNumber.toLowerCase().includes(search.toLowerCase()) &&
        !v.vesselName.toLowerCase().includes(search.toLowerCase()) &&
        !(v.sailingRoute || '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortBy]
    const bVal = b[sortBy]
    return sortOrder === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number)
  })

  // Aggregates
  const totalProfit = voyages.reduce((s, v) => s + v.netProfit, 0)
  const avgMargin = voyages.length > 0 ? voyages.reduce((s, v) => s + v.profitMargin, 0) / voyages.length : 0
  const bestVessel = voyages.length > 0
    ? voyages.reduce((best, v) => v.profitMargin > best.profitMargin ? v : best, voyages[0])
    : null
  const bestRoute = voyages.length > 0
    ? Object.entries(
        voyages.reduce<Record<string, { totalProfit: number; count: number }>>((acc, v) => {
          const route = v.sailingRoute || 'Unknown'
          if (!acc[route]) acc[route] = { totalProfit: 0, count: 0 }
          acc[route].totalProfit += v.netProfit
          acc[route].count++
          return acc
        }, {})
      ).map(([name, { totalProfit, count }]) => ({ name, avgProfit: totalProfit / count }))
      .sort((a, b) => b.avgProfit - a.avgProfit)[0]?.name || '—'
    : '—'

  // Chart data
  const profitByVessel = sorted
    .slice(0, 10)
    .map(v => ({
      vessel: v.vesselName.length > 12 ? v.vesselName.slice(0, 12) + '…' : v.vesselName,
      profit: Math.round(v.netProfit),
      revenue: Math.round(v.totalRevenue),
      expenses: Math.round(v.totalExpenses),
    }))

  const profitByRoute = Object.entries(
    voyages.reduce<Record<string, { totalProfit: number; count: number }>>((acc, v) => {
      const route = v.sailingRoute || 'Unknown'
      if (!acc[route]) acc[route] = { totalProfit: 0, count: 0 }
      acc[route].totalProfit += v.netProfit
      acc[route].count++
      return acc
    }, {})
  ).map(([name, { totalProfit }]) => ({
    route: name.length > 15 ? name.slice(0, 15) + '…' : name,
    profit: Math.round(totalProfit),
  })).sort((a, b) => b.profit - a.profit)

  const profitPerTEUData = sorted
    .filter(v => v.profitPerTEU !== 0)
    .slice(0, 10)
    .map(v => ({
      voyage: v.voyageNumber.slice(-4),
      profitPerTEU: Math.round(v.profitPerTEU),
    }))

  const barChartConfig: ChartConfig = {
    profit: { label: 'Net Profit', color: '#10b981' },
    revenue: { label: 'Revenue', color: '#3b82f6' },
    expenses: { label: 'Expenses', color: '#ef4444' },
  }

  const routeChartConfig: ChartConfig = {
    profit: { label: 'Profit', color: '#f59e0b' },
  }

  const teuChartConfig: ChartConfig = {
    profitPerTEU: { label: 'Profit/TEU', color: '#8b5cf6' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl p-3 bg-amber-50 dark:bg-amber-950/30">
          <TrendingUp className="size-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Voyage Profitability Analysis</h1>
          <p className="text-muted-foreground">Cross-voyage financial performance comparison</p>
        </div>
      </div>

      <Separator />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-emerald-50 dark:bg-emerald-950/30">
                <DollarSign className="size-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Profit</p>
                <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(totalProfit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-amber-50 dark:bg-amber-950/30">
                <TrendingUp className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Average Margin</p>
                <p className={`text-2xl font-bold ${avgMargin >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  {avgMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-blue-50 dark:bg-blue-950/30">
                <Ship className="size-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Best Vessel</p>
                <p className="text-sm font-bold truncate">{bestVessel?.vesselName || '—'}</p>
                <p className="text-xs text-muted-foreground">
                  {bestVessel ? `${bestVessel.profitMargin.toFixed(1)}% margin` : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-teal-50 dark:bg-teal-950/30">
                <MapPin className="size-4 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Best Route</p>
                <p className="text-sm font-bold truncate">{bestRoute}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by voyage, vessel, or route..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <ArrowUpDown className="size-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="netProfit">Sort by Net Profit</SelectItem>
                <SelectItem value="margin">Sort by Margin %</SelectItem>
                <SelectItem value="profitPerTEU">Sort by Profit/TEU</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as typeof sortOrder)}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit by Vessel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profit by Vessel</CardTitle>
            <CardDescription>Revenue, Expenses, and Net Profit per vessel</CardDescription>
          </CardHeader>
          <CardContent>
            {profitByVessel.length > 0 ? (
              <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitByVessel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="vessel" type="category" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" name="Revenue" />
                    <Bar dataKey="expenses" fill="var(--color-expenses)" name="Expenses" />
                    <Bar dataKey="profit" fill="var(--color-profit)" name="Net Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profit by Route */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profit by Route</CardTitle>
          </CardHeader>
          <CardContent>
            {profitByRoute.length > 0 ? (
              <ChartContainer config={routeChartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitByRoute} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="route" type="category" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="profit" fill="var(--color-profit)" radius={[0, 4, 4, 0]} name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profit per TEU */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Profit per TEU Comparison</CardTitle>
            <CardDescription>Profit efficiency per TEU across voyages</CardDescription>
          </CardHeader>
          <CardContent>
            {profitPerTEUData.length > 0 ? (
              <ChartContainer config={teuChartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitPerTEUData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="voyage" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="profitPerTEU" fill="var(--color-profitPerTEU)" radius={[4, 4, 0, 0]} name="Profit/TEU" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profitability Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Voyage Profitability Details</CardTitle>
          <CardDescription>{sorted.length} voyage{sorted.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Anchor className="size-8 mx-auto mb-2 opacity-40" />
              <p>No voyage profitability data found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voyage #</TableHead>
                    <TableHead>Vessel</TableHead>
                    <TableHead className="hidden md:table-cell">Route</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Net Profit</TableHead>
                    <TableHead className="text-right">Profit/TEU</TableHead>
                    <TableHead className="text-right">Margin %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((v) => (
                    <TableRow
                      key={v.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => selectVoyage(v.id)}
                    >
                      <TableCell>
                        <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">
                          {v.voyageNumber}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{v.vesselName}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {v.sailingRoute || '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(v.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(v.totalExpenses)}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm font-semibold ${v.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(v.netProfit)}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm ${v.profitPerTEU >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(v.profitPerTEU)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className={
                          v.profitMargin >= 20 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          v.profitMargin >= 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }>
                          {v.profitMargin.toFixed(1)}%
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
