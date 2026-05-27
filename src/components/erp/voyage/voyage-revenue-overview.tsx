'use client'

import React, { useState, useEffect } from 'react'
import {
  Banknote,
  Filter,
  Search,
  Anchor,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
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
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { useNavigationStore } from '@/lib/store'

const REVENUE_TYPES = [
  { value: 'freight_income', label: 'Freight Income' },
  { value: 'slot_revenue', label: 'Slot Revenue' },
  { value: 'surcharges', label: 'Surcharges' },
  { value: 'handling_income', label: 'Handling Income' },
  { value: 'service_charges', label: 'Service Charges' },
]

const PIE_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6']

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface RevenueItem {
  id: string
  revenueType: string
  currency: string
  exchangeRate: number
  amount: number
  amountBase: number | null
  description: string | null
  invoiceNumber: string | null
  paymentStatus: string
  revenueDate: string
}

interface VoyageData {
  id: string
  voyageNumber: string
  vesselName: string
  etd: string | null
  revenues: RevenueItem[]
}

export function VoyageRevenueOverview() {
  const { selectVoyage } = useNavigationStore()
  const [voyages, setVoyages] = useState<VoyageData[]>([])
  const [loading, setLoading] = useState(true)
  const [revenueTypeFilter, setRevenueTypeFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch('/api/voyages?limit=100')
        const data = await res.json()
        if (data.success) {
          // Need to fetch full details for each voyage to get revenues
          const voyageDetails = await Promise.all(
            (data.data || []).map(async (v: { id: string }) => {
              try {
                const detailRes = await fetch(`/api/voyages/${v.id}`)
                const detailData = await detailRes.json()
                return detailData.success ? detailData.data : null
              } catch {
                return null
              }
            })
          )
          setVoyages(voyageDetails.filter(Boolean) as VoyageData[])
        }
      } catch {
        console.error('Failed to fetch voyages')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Flatten all revenues with voyage info
  const allRevenues = voyages.flatMap(v =>
    (v.revenues || []).map(r => ({
      ...r,
      voyageId: v.id,
      voyageNumber: v.voyageNumber,
      vesselName: v.vesselName,
    }))
  )

  // Filters
  const filtered = allRevenues.filter(r => {
    if (revenueTypeFilter !== 'all' && r.revenueType !== revenueTypeFilter) return false
    if (paymentFilter !== 'all' && r.paymentStatus !== paymentFilter) return false
    if (search && !r.voyageNumber.toLowerCase().includes(search.toLowerCase()) &&
        !r.vesselName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Aggregates
  const totalRevenue = filtered.reduce((s, r) => s + (r.amountBase || 0), 0)
  const paidRevenue = filtered.filter(r => r.paymentStatus === 'paid').reduce((s, r) => s + (r.amountBase || 0), 0)
  const pendingRevenue = filtered.filter(r => r.paymentStatus === 'pending').reduce((s, r) => s + (r.amountBase || 0), 0)

  // Revenue by type
  const revenueByType = REVENUE_TYPES.map(t => ({
    name: t.label,
    value: Math.round(filtered.filter(r => r.revenueType === t.value).reduce((s, r) => s + (r.amountBase || 0), 0)),
  })).filter(d => d.value > 0)

  // Revenue trend (by voyage)
  const trendData = voyages
    .filter(v => v.revenues && v.revenues.length > 0)
    .map(v => ({
      name: v.voyageNumber.slice(-4),
      revenue: Math.round(v.revenues.reduce((s, r) => s + (r.amountBase || 0), 0)),
    }))

  const lineChartConfig: ChartConfig = {
    revenue: { label: 'Revenue', color: '#10b981' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl p-3 bg-emerald-50 dark:bg-emerald-950/30">
          <Banknote className="size-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Voyage Revenue Overview</h1>
          <p className="text-muted-foreground">Aggregate view of all voyage revenue streams</p>
        </div>
      </div>

      <Separator />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-emerald-50 dark:bg-emerald-950/30">
                <DollarSign className="size-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-yellow-50 dark:bg-yellow-950/30">
                <Clock className="size-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-green-50 dark:bg-green-950/30">
                <CheckCircle2 className="size-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(paidRevenue)}</p>
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
            <Select value={revenueTypeFilter} onValueChange={setRevenueTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="size-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Revenue Types</SelectItem>
                {REVENUE_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Type Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {revenueByType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
            <CardDescription>Revenue across voyages</CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} name="Revenue" />
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

      {/* Revenue Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue Records</CardTitle>
          <CardDescription>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</CardDescription>
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
              <Banknote className="size-8 mx-auto mb-2 opacity-40" />
              <p>No revenue records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voyage</TableHead>
                    <TableHead>Vessel</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Amount (Base)</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow
                      key={r.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => selectVoyage(r.voyageId)}
                    >
                      <TableCell>
                        <span className="font-mono text-amber-700 dark:text-amber-400 text-sm">{r.voyageNumber}</span>
                      </TableCell>
                      <TableCell className="text-sm">{r.vesselName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {REVENUE_TYPES.find(t => t.value === r.revenueType)?.label || r.revenueType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{r.currency}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{r.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{(r.amountBase || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.invoiceNumber || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={
                          r.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          r.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }>
                          {r.paymentStatus}
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
