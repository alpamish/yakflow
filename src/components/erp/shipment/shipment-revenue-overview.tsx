'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  DollarSign,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

const revenueTypeLabels: Record<string, string> = {
  othc: 'OTHC', dthc: 'DTHC', x_ray: 'X-RAY', inspection: 'INSPECTION',
  d_and_d: 'D&D', storage: 'STORAGE', doc: 'DOC', pick_up: 'PICK UP',
}

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  partial: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

interface RevenueRow {
  id: string
  customer: { id: string; name: string } | null
  revenueType: string
  invoiceNumber: string | null
  currency: string
  exchangeRate: number
  amount: number
  tax: number
  amountBase: number | null
  taxBase: number | null
  dueDate: string | null
  paymentStatus: string
}

export function ShipmentRevenueOverview() {
  const [allRevenues, setAllRevenues] = useState<(RevenueRow & { shipmentNumber: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [chargeTypes, setChargeTypes] = useState<{ value: string; label: string }[]>([])
  const [baseCurrency, setBaseCurrency] = useState('USD')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data?.baseCurrency) {
          setBaseCurrency(json.data.baseCurrency)
        }
      })
      .catch(() => {})
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: baseCurrency,
    }).format(amount)
  }

  useEffect(() => {
    fetch('/api/charge-types?type=revenue')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setChargeTypes(json.data.map((t: { value: string; label: string }) => ({ value: t.value, label: t.label })))
      })
      .catch(console.error)
  }, [])

  const fetchRevenues = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/shipments?limit=100')
      const json = await res.json()
      if (json.success) {
        const revenues: (RevenueRow & { shipmentNumber: string })[] = []
        for (const shipment of json.data as { id: string; shipmentNumber: string }[]) {
          try {
            const rRes = await fetch(`/api/shipments/${shipment.id}/revenues`)
            const rJson = await rRes.json()
            if (rJson.success) {
              for (const r of rJson.data) {
                revenues.push({ ...r, shipmentNumber: shipment.shipmentNumber })
              }
            }
          } catch {
            // skip
          }
        }
        setAllRevenues(revenues)
      }
    } catch (err) {
      console.error('Failed to fetch revenues:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRevenues()
  }, [fetchRevenues])

  const filtered = allRevenues.filter((r) => {
    if (search && !r.shipmentNumber.toLowerCase().includes(search.toLowerCase()) && !(r.customer?.name || '').toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter && r.revenueType !== typeFilter) return false
    if (paymentFilter && r.paymentStatus !== paymentFilter) return false
    return true
  })

  const totalRevenue = filtered.reduce((sum, r) => sum + (r.amountBase || 0) + (r.taxBase || 0), 0)
  const pendingAmount = filtered.filter(r => r.paymentStatus === 'pending').reduce((sum, r) => sum + (r.amountBase || 0) + (r.taxBase || 0), 0)
  const overdueAmount = filtered.filter(r => r.paymentStatus === 'overdue').reduce((sum, r) => sum + (r.amountBase || 0) + (r.taxBase || 0), 0)

  // Revenue by type for chart
  const revenueByType: Record<string, number> = {}
  for (const r of filtered) {
    const type = revenueTypeLabels[r.revenueType] || r.revenueType
    revenueByType[type] = (revenueByType[type] || 0) + (r.amountBase || 0) + (r.taxBase || 0)
  }
  const chartData = Object.entries(revenueByType)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shipment Revenue</h1>
        <p className="text-muted-foreground text-sm">
          Monitor revenue streams from shipment operations
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2">
                <DollarSign className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/30 p-2">
                <Clock className="size-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-xl font-bold">{formatCurrency(pendingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-2">
                <AlertTriangle className="size-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue Amount</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(overdueAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by shipment or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Revenue Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {chargeTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearch('')
                setTypeFilter('')
                setPaymentFilter('')
              }}
            >
              <Filter className="size-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue by Type</CardTitle>
            <CardDescription>Breakdown of revenue categories</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" name="Revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              All Revenue Records
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filtered.length} records)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <TrendingUp className="size-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">No revenue found</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Revenue will appear when added to shipments
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[calc(100vh-420px)] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Shipment #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Revenue Type</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Total (Base)</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                          {r.shipmentNumber}
                        </TableCell>
                        <TableCell>{r.customer?.name || '—'}</TableCell>
                        <TableCell>{revenueTypeLabels[r.revenueType] || r.revenueType}</TableCell>
                        <TableCell>{r.invoiceNumber || '—'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(r.amount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(r.tax)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency((r.amountBase || 0) + (r.taxBase || 0))}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={paymentStatusColors[r.paymentStatus] || ''}>
                            {r.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'}
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
    </div>
  )
}
