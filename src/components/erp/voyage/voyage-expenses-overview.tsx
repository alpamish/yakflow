'use client'

import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  Filter,
  Search,
  Anchor,
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { useNavigationStore } from '@/lib/store'

const EXPENSE_TYPES = [
  { value: 'ocean_freight', label: 'Ocean Freight' },
  { value: 'port_charges', label: 'Port Charges' },
  { value: 'fuel_costs', label: 'Fuel Costs' },
  { value: 'bunker_costs', label: 'Bunker Costs' },
  { value: 'canal_fees', label: 'Canal Fees' },
  { value: 'rail_costs', label: 'Rail Costs' },
  { value: 'customs', label: 'Customs' },
  { value: 'x_ray', label: 'X-Ray' },
  { value: 'terminal_handling', label: 'Terminal Handling' },
  { value: 'agency_costs', label: 'Agency Costs' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'crew_costs', label: 'Crew Costs' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
]

const PIE_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#06b6d4', '#f97316', '#6366f1', '#ec4899', '#14b8a6', '#84cc16', '#a855f7', '#0ea5e9']

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface ExpenseItem {
  id: string
  expenseType: string
  vendorId: string | null
  vendor: { id: string; name: string } | null
  currency: string
  exchangeRate: number
  amount: number
  amountBase: number | null
  description: string | null
  invoiceNumber: string | null
  paymentStatus: string
  expenseDate: string
}

interface VoyageData {
  id: string
  voyageNumber: string
  vesselName: string
  expenses: ExpenseItem[]
}

export function VoyageExpensesOverview() {
  const { selectVoyage } = useNavigationStore()
  const [voyages, setVoyages] = useState<VoyageData[]>([])
  const [loading, setLoading] = useState(true)
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch('/api/voyages?limit=100')
        const data = await res.json()
        if (data.success) {
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

  // Flatten all expenses with voyage info
  const allExpenses = voyages.flatMap(v =>
    (v.expenses || []).map(e => ({
      ...e,
      voyageId: v.id,
      voyageNumber: v.voyageNumber,
      vesselName: v.vesselName,
    }))
  )

  // Unique vendors for filter
  const vendors = Array.from(new Map(
    allExpenses.filter(e => e.vendor).map(e => [e.vendor!.id, e.vendor!.name])
  ).entries()).map(([id, name]) => ({ id, name }))

  // Filters
  const filtered = allExpenses.filter(e => {
    if (expenseTypeFilter !== 'all' && e.expenseType !== expenseTypeFilter) return false
    if (paymentFilter !== 'all' && e.paymentStatus !== paymentFilter) return false
    if (vendorFilter !== 'all' && e.vendorId !== vendorFilter) return false
    if (search && !e.voyageNumber.toLowerCase().includes(search.toLowerCase()) &&
        !e.vesselName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Aggregates
  const totalExpenses = filtered.reduce((s, e) => s + (e.amountBase || 0), 0)
  const paidExpenses = filtered.filter(e => e.paymentStatus === 'paid').reduce((s, e) => s + (e.amountBase || 0), 0)
  const pendingExpenses = filtered.filter(e => e.paymentStatus === 'pending').reduce((s, e) => s + (e.amountBase || 0), 0)

  // Expense breakdown by type
  const expenseByType = EXPENSE_TYPES.map(t => ({
    name: t.label,
    value: Math.round(filtered.filter(e => e.expenseType === t.value).reduce((s, e) => s + (e.amountBase || 0), 0)),
  })).filter(d => d.value > 0)

  // Expense by vessel
  const expenseByVessel = voyages
    .filter(v => v.expenses && v.expenses.length > 0)
    .map(v => ({
      vessel: v.vesselName.length > 12 ? v.vesselName.slice(0, 12) + '…' : v.vesselName,
      expense: Math.round(v.expenses.reduce((s, e) => s + (e.amountBase || 0), 0)),
    }))
    .filter(d => d.expense > 0)

  const barChartConfig: ChartConfig = {
    expense: { label: 'Expenses', color: '#ef4444' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl p-3 bg-red-50 dark:bg-red-950/30">
          <CreditCard className="size-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Voyage Expenses Overview</h1>
          <p className="text-muted-foreground">Aggregate view of all voyage expenses</p>
        </div>
      </div>

      <Separator />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-red-50 dark:bg-red-950/30">
                <DollarSign className="size-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
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
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingExpenses)}</p>
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
                <p className="text-2xl font-bold text-green-600">{formatCurrency(paidExpenses)}</p>
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
            <Select value={expenseTypeFilter} onValueChange={setExpenseTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="size-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Expense Types</SelectItem>
                {EXPENSE_TYPES.map(t => (
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
            {vendors.length > 0 && (
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expense Breakdown by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {expenseByType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense by Vessel Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expenses by Vessel</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseByVessel.length > 0 ? (
              <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseByVessel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="vessel" type="category" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="expense" fill="var(--color-expense)" radius={[0, 4, 4, 0]} name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expense Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Expense Records</CardTitle>
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
              <CreditCard className="size-8 mx-auto mb-2 opacity-40" />
              <p>No expense records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voyage</TableHead>
                    <TableHead>Vessel</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Amount (Base)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow
                      key={e.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => selectVoyage(e.voyageId)}
                    >
                      <TableCell>
                        <span className="font-mono text-amber-700 dark:text-amber-400 text-sm">{e.voyageNumber}</span>
                      </TableCell>
                      <TableCell className="text-sm">{e.vesselName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {EXPENSE_TYPES.find(t => t.value === e.expenseType)?.label || e.expenseType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{e.vendor?.name || '—'}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{e.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{(e.amountBase || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={
                          e.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          e.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }>
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
  )
}
