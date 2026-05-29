'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Receipt,
  Search,
  Filter,
  DollarSign,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
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

const CHART_COLORS = [
  '#10b981', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#6366f1', '#ec4899', '#84cc16',
]

const expenseTypeLabels: Record<string, string> = {
  othc: 'OTHC', dthc: 'DTHC', x_ray: 'X-RAY', inspection: 'INSPECTION',
  d_and_d: 'D&D', storage: 'STORAGE', doc: 'DOC', pick_up: 'PICK UP',
}

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  partial: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
}

interface ExpenseRow {
  id: string
  expenseType: string
  vendor: { id: string; name: string } | null
  currency: string
  amount: number
  tax: number
  amountBase: number | null
  taxBase: number | null
  paymentStatus: string
  invoiceNumber: string | null
  notes: string | null
  expenseDate: string
}

interface ShipmentWithExpenses {
  id: string
  shipmentNumber: string
  expenses: ExpenseRow[]
}

export function ShipmentExpensesOverview() {
  const [allExpenses, setAllExpenses] = useState<(ExpenseRow & { shipmentNumber: string })[]>([])
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
    fetch('/api/charge-types?type=expense')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setChargeTypes(json.data.map((t: { value: string; label: string }) => ({ value: t.value, label: t.label })))
      })
      .catch(console.error)
  }, [])

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/shipments?limit=100')
      const json = await res.json()
      if (json.success) {
        const expenses: (ExpenseRow & { shipmentNumber: string })[] = []
        for (const shipment of json.data as ShipmentWithExpenses[]) {
          try {
            const eRes = await fetch(`/api/shipments/${shipment.id}/expenses`)
            const eJson = await eRes.json()
            if (eJson.success) {
              for (const e of eJson.data) {
                expenses.push({ ...e, shipmentNumber: shipment.shipmentNumber })
              }
            }
          } catch {
            // skip
          }
        }
        setAllExpenses(expenses)
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const filtered = allExpenses.filter((e) => {
    if (search && !e.shipmentNumber.toLowerCase().includes(search.toLowerCase()) && !(e.vendor?.name || '').toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter && e.expenseType !== typeFilter) return false
    if (paymentFilter && e.paymentStatus !== paymentFilter) return false
    return true
  })

  const totalExpenses = filtered.reduce((sum, e) => sum + (e.amountBase || 0) + (e.taxBase || 0), 0)
  const pendingAmount = filtered.filter(e => e.paymentStatus === 'pending').reduce((sum, e) => sum + (e.amountBase || 0) + (e.taxBase || 0), 0)
  const paidAmount = filtered.filter(e => e.paymentStatus === 'paid').reduce((sum, e) => sum + (e.amountBase || 0) + (e.taxBase || 0), 0)

  // Expense by type for chart
  const expenseByType: Record<string, number> = {}
  for (const e of filtered) {
    const type = expenseTypeLabels[e.expenseType] || e.expenseType
    expenseByType[type] = (expenseByType[type] || 0) + (e.amountBase || 0) + (e.taxBase || 0)
  }
  const chartData = Object.entries(expenseByType)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shipment Expenses</h1>
        <p className="text-muted-foreground text-sm">
          Track and manage all expenses associated with shipments
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-2">
                <DollarSign className="size-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-xl font-bold">{formatCurrency(totalExpenses)}</p>
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
              <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-2">
                <CheckCircle2 className="size-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid Amount</p>
                <p className="text-xl font-bold">{formatCurrency(paidAmount)}</p>
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
                placeholder="Search by shipment or vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Expense Type" />
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
            <CardTitle className="text-base">Expense Breakdown</CardTitle>
            <CardDescription>By expense type</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              All Expenses
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
                <Receipt className="size-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">No expenses found</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Expenses will appear when added to shipments
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[calc(100vh-420px)] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Shipment #</TableHead>
                      <TableHead>Expense Type</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Total (Base)</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                          {e.shipmentNumber}
                        </TableCell>
                        <TableCell>{expenseTypeLabels[e.expenseType] || e.expenseType}</TableCell>
                        <TableCell>{e.vendor?.name || '—'}</TableCell>
                        <TableCell>{e.currency}</TableCell>
                        <TableCell className="text-right">{formatCurrency(e.amount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(e.tax)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency((e.amountBase || 0) + (e.taxBase || 0))}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={paymentStatusColors[e.paymentStatus] || ''}>
                            {e.paymentStatus}
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
    </div>
  )
}
