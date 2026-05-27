'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Filter,
  Search,
  Anchor,
  TrendingUp,
  Container,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
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
  LineChart,
  Line,
  Legend,
} from 'recharts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { useNavigationStore } from '@/lib/store'

interface VoyageWithTeu {
  id: string
  voyageNumber: string
  vesselName: string
  sailingRoute: string | null
  etd: string | null
  status: string
  teuSummary: { totalTEUs: number; loadedTEUs: number; teuUtilization: number | null } | null
  teuRecords: Array<{
    totalContainers: number
    totalTEUs: number
    loadedTEUs: number
    emptyTEUs: number
    twentyFoot: number
    fortyFoot: number
    fortyFiveFoot: number
    reeferUnits: number
    specialUnits: number
    teuUtilization: number | null
    recordedAt: string
  }>
}

export function VoyageTeuOverview() {
  const { selectVoyage } = useNavigationStore()
  const [voyages, setVoyages] = useState<VoyageWithTeu[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [routeFilter, setRouteFilter] = useState('all')

  useEffect(() => {
    async function fetchVoyages() {
      setLoading(true)
      try {
        const res = await fetch('/api/voyages?limit=100')
        const data = await res.json()
        if (data.success) {
          setVoyages(data.data || [])
        }
      } catch {
        console.error('Failed to fetch voyages')
      } finally {
        setLoading(false)
      }
    }
    fetchVoyages()
  }, [])

  // Aggregate stats
  const totalTEUs = voyages.reduce((s, v) => s + (v.teuSummary?.totalTEUs || 0), 0)
  const totalLoaded = voyages.reduce((s, v) => s + (v.teuSummary?.loadedTEUs || 0), 0)
  const totalEmpty = totalTEUs - totalLoaded
  const avgUtilization = totalTEUs > 0 ? (totalLoaded / totalTEUs) * 100 : 0
  const totalContainers = voyages.reduce((s, v) => {
    const latest = v.teuRecords?.[0]
    return s + (latest?.totalContainers || 0)
  }, 0)

  // Unique routes for filter
  const routes = Array.from(new Set(voyages.map(v => v.sailingRoute).filter(Boolean) as string[]))

  // Filter
  const filtered = voyages.filter(v => {
    if (search && !v.voyageNumber.toLowerCase().includes(search.toLowerCase()) &&
        !v.vesselName.toLowerCase().includes(search.toLowerCase())) return false
    if (routeFilter !== 'all' && v.sailingRoute !== routeFilter) return false
    return true
  })

  // Chart data - utilization by vessel
  const vesselData = filtered
    .filter(v => v.teuSummary)
    .map(v => ({
      vessel: v.vesselName.length > 12 ? v.vesselName.slice(0, 12) + '…' : v.vesselName,
      total: v.teuSummary?.totalTEUs || 0,
      loaded: v.teuSummary?.loadedTEUs || 0,
      utilization: v.teuSummary?.teuUtilization || 0,
    }))

  // Trend data (by voyage order)
  const trendData = filtered
    .filter(v => v.teuSummary)
    .map(v => ({
      name: v.voyageNumber.slice(-4),
      utilization: Number((v.teuSummary?.teuUtilization || 0).toFixed(1)),
      teus: v.teuSummary?.totalTEUs || 0,
    }))

  const barChartConfig: ChartConfig = {
    total: { label: 'Total TEUs', color: '#f59e0b' },
    loaded: { label: 'Loaded TEUs', color: '#10b981' },
  }

  const lineChartConfig: ChartConfig = {
    utilization: { label: 'Utilization %', color: '#f59e0b' },
    teus: { label: 'Total TEUs', color: '#3b82f6' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl p-3 bg-amber-50 dark:bg-amber-950/30">
          <Box className="size-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">TEU Management Overview</h1>
          <p className="text-muted-foreground">Cross-voyage TEU allocation and utilization analysis</p>
        </div>
      </div>

      <Separator />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-amber-50 dark:bg-amber-950/30">
                <Box className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total TEUs</p>
                <p className="text-2xl font-bold">{totalTEUs.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-emerald-50 dark:bg-emerald-950/30">
                <TrendingUp className="size-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Utilization</p>
                <p className="text-2xl font-bold text-amber-600">{avgUtilization.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-blue-50 dark:bg-blue-950/30">
                <Container className="size-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Containers</p>
                <p className="text-2xl font-bold">{totalContainers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-gray-50 dark:bg-gray-800/30">
                <Box className="size-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Loaded / Empty</p>
                <p className="text-lg font-bold">
                  <span className="text-emerald-600">{totalLoaded.toLocaleString()}</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="text-gray-500">{totalEmpty.toLocaleString()}</span>
                </p>
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
                placeholder="Search by voyage or vessel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={routeFilter} onValueChange={setRouteFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="size-4 mr-2" />
                <SelectValue placeholder="All Routes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Routes</SelectItem>
                {routes.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TEU Distribution by Vessel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">TEU Distribution by Vessel</CardTitle>
            <CardDescription>Total vs Loaded TEUs per vessel</CardDescription>
          </CardHeader>
          <CardContent>
            {vesselData.length > 0 ? (
              <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vesselData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="vessel" type="category" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} name="Total TEUs" />
                    <Bar dataKey="loaded" fill="var(--color-loaded)" radius={[0, 4, 4, 0]} name="Loaded TEUs" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No TEU data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Utilization Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Utilization Trend</CardTitle>
            <CardDescription>TEU utilization across voyages</CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="utilization" stroke="var(--color-utilization)" strokeWidth={2} name="Utilization %" />
                    <Line yAxisId="right" type="monotone" dataKey="teus" stroke="var(--color-teus)" strokeWidth={2} name="Total TEUs" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Voyage TEU Details</CardTitle>
          <CardDescription>Breakdown by voyage</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Anchor className="size-8 mx-auto mb-2 opacity-40" />
              <p>No voyage TEU data found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voyage #</TableHead>
                    <TableHead>Vessel</TableHead>
                    <TableHead className="text-right">Total TEUs</TableHead>
                    <TableHead className="text-right">Loaded</TableHead>
                    <TableHead className="text-right">Empty</TableHead>
                    <TableHead className="text-right">Utilization</TableHead>
                    <TableHead className="text-right hidden md:table-cell">20ft</TableHead>
                    <TableHead className="text-right hidden md:table-cell">40ft</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Reefer</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Special</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((v) => {
                    const latest = v.teuRecords?.[0]
                    const util = v.teuSummary?.teuUtilization || 0
                    return (
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
                        <TableCell className="text-right font-mono font-semibold">
                          {v.teuSummary?.totalTEUs || 0}
                        </TableCell>
                        <TableCell className="text-right font-mono text-emerald-600">
                          {v.teuSummary?.loadedTEUs || 0}
                        </TableCell>
                        <TableCell className="text-right font-mono text-gray-500">
                          {(v.teuSummary?.totalTEUs || 0) - (v.teuSummary?.loadedTEUs || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={util} className="h-2 w-16" />
                            <span className="text-xs font-mono w-12 text-right">
                              {util.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono hidden md:table-cell">
                          {latest?.twentyFoot || 0}
                        </TableCell>
                        <TableCell className="text-right font-mono hidden md:table-cell">
                          {latest?.fortyFoot || 0}
                        </TableCell>
                        <TableCell className="text-right font-mono hidden lg:table-cell">
                          {latest?.reeferUnits || 0}
                        </TableCell>
                        <TableCell className="text-right font-mono hidden lg:table-cell">
                          {latest?.specialUnits || 0}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
