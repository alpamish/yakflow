'use client'

import React, { useEffect, useState } from 'react'
import {
  Ship,
  Activity,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Plus,
  BarChart3,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  RefreshCw,
  Clock,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useNavigationStore } from '@/lib/store'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

// === Chart Color Palette ===
const CHART_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

// === Currency Formatting ===
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value)

// === Expense Type Labels ===
const EXPENSE_LABELS: Record<string, string> = {
  ocean_freight: 'Ocean Freight',
  air_freight: 'Air Freight',
  trucking: 'Trucking',
  customs: 'Customs',
  port_charges: 'Port Charges',
  documentation: 'Documentation',
  insurance: 'Insurance',
  warehousing: 'Warehousing',
  fuel_surcharge: 'Fuel Surcharge',
  demurrage: 'Demurrage',
  other: 'Other',
}

// === Dashboard Data Types ===
interface DashboardData {
  shipments: {
    total: number
    active: number
    delivered: number
    delayed: number
  }
  voyages: {
    total: number
    active: number
  }
  monthly: {
    revenue: number
    expenses: number
    netProfit: number
  }
  shipmentTrends: { month: string; count: number }[]
  revenueTrends: { month: string; revenue: number; expense: number; profit: number }[]
  expenseBreakdown: Record<string, number>
  countryCounts: Record<string, number>
  topCustomers: {
    customerId: string
    customerName: string
    customerCode: string
    totalRevenue: number
  }[]
}

// === Custom Tooltip Component ===
function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      {label && <p className="mb-1 text-sm font-medium text-muted-foreground">{label}</p>}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold">
            {typeof entry.value === 'number' && (entry.name === 'Revenue' || entry.name === 'Expenses' || entry.name === 'Profit')
              ? formatCurrency(entry.value)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// === KPI Card Component ===
function KPICard({
  title,
  value,
  change,
  icon: Icon,
  color,
  bgColor,
  loading,
}: {
  title: string
  value: string
  change: number | null
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  loading: boolean
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription className="text-sm font-medium">{title}</CardDescription>
        <div className={`rounded-lg p-2 ${bgColor}`}>
          <Icon className={`size-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {loading ? (
          <Skeleton className="h-4 w-32 mt-1" />
        ) : change !== null ? (
          <div className="flex items-center text-xs mt-1">
            {change >= 0 ? (
              <ArrowUpRight className="size-3 text-emerald-600 mr-1" />
            ) : (
              <ArrowDownRight className="size-3 text-rose-600 mr-1" />
            )}
            <span className={change >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="text-muted-foreground ml-1">vs last month</span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">No prior data</p>
        )}
      </CardContent>
    </Card>
  )
}

// === Main Dashboard Page ===
export function DashboardPage() {
  const { navigateTo } = useNavigationStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/dashboard')
        if (!res.ok) throw new Error('Failed to fetch dashboard data')
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        } else {
          throw new Error(json.error || 'Unknown error')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  // Format current date — use state to avoid SSR/client hydration mismatch
  const [currentDate, setCurrentDate] = useState('')
  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    )
  }, [])

  // Transform expense breakdown from object to array for recharts
  const expenseBreakdownData = data
    ? Object.entries(data.expenseBreakdown).map(([type, total]) => ({
        name: EXPENSE_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value: Math.round(total * 100) / 100,
      }))
    : []

  // Transform country counts from object to array for recharts
  const countryData = data
    ? Object.entries(data.countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    : []

  // Top customers data
  const topCustomersData = data
    ? data.topCustomers.map((c) => ({
        name: c.customerName,
        revenue: c.totalRevenue,
      }))
    : []

  // Calculate change percentages (compare last month to previous month in trends)
  const getChangePercent = (trends: { count: number }[] | undefined) => {
    if (!trends || trends.length < 2) return null
    const current = trends[trends.length - 1].count
    const previous = trends[trends.length - 2].count
    if (previous === 0) return current > 0 ? 100 : null
    return ((current - previous) / previous) * 100
  }

  const shipmentChange = getChangePercent(data?.shipmentTrends)

  const revenueChange = (() => {
    if (!data?.revenueTrends || data.revenueTrends.length < 2) return null
    const current = data.revenueTrends[data.revenueTrends.length - 1].revenue
    const previous = data.revenueTrends[data.revenueTrends.length - 2].revenue
    if (previous === 0) return current > 0 ? 100 : null
    return ((current - previous) / previous) * 100
  })()

  const expenseChange = (() => {
    if (!data?.revenueTrends || data.revenueTrends.length < 2) return null
    const current = data.revenueTrends[data.revenueTrends.length - 1].expense
    const previous = data.revenueTrends[data.revenueTrends.length - 2].expense
    if (previous === 0) return current > 0 ? 100 : null
    return ((current - previous) / previous) * 100
  })()

  const profitChange = (() => {
    if (!data?.revenueTrends || data.revenueTrends.length < 2) return null
    const current = data.revenueTrends[data.revenueTrends.length - 1].profit
    const previous = data.revenueTrends[data.revenueTrends.length - 2].profit
    if (previous === 0) return current > 0 ? 100 : null
    return ((current - previous) / previous) * 100
  })()

  // KPI cards configuration
  const kpiCards = [
    {
      title: 'Total Shipments',
      value: data ? data.shipments.total.toLocaleString() : '0',
      change: shipmentChange,
      icon: Ship,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      title: 'Active Shipments',
      value: data ? data.shipments.active.toLocaleString() : '0',
      change: null,
      icon: Activity,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 dark:bg-teal-950/30',
    },
    {
      title: 'Delivered',
      value: data ? data.shipments.delivered.toLocaleString() : '0',
      change: null,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      title: 'Delayed',
      value: data ? data.shipments.delayed.toLocaleString() : '0',
      change: null,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      title: 'Monthly Revenue',
      value: data ? formatCurrency(data.monthly.revenue) : '$0',
      change: revenueChange,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      title: 'Monthly Expenses',
      value: data ? formatCurrency(data.monthly.expenses) : '$0',
      change: expenseChange,
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    },
    {
      title: 'Net Profit',
      value: data ? formatCurrency(data.monthly.netProfit) : '$0',
      change: profitChange,
      icon: data && data.monthly.netProfit >= 0 ? TrendingUp : TrendingDown,
      color: data && data.monthly.netProfit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: data && data.monthly.netProfit >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome to FreightFlow ERP
            </h1>
            <p className="mt-1 text-emerald-100">
              Your complete freight forwarding and logistics management dashboard.
            </p>
          </div>
          <div className="flex items-center gap-2 text-emerald-100">
            <Calendar className="size-4" />
            <span className="text-sm font-medium">{currentDate || '\u2026'}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => navigateTo('shipments')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="mr-2 size-4" />
          New Shipment
        </Button>
        <Button
          variant="outline"
          onClick={() => navigateTo('voyage')}
          className="border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
        >
          <Plus className="mr-2 size-4" />
          New Voyage
        </Button>
        <Button
          variant="outline"
          onClick={() => navigateTo('analytics')}
        >
          <BarChart3 className="mr-2 size-4" />
          View Reports
        </Button>
        <Button
          variant="outline"
          onClick={() => navigateTo('settings')}
        >
          <Settings className="mr-2 size-4" />
          Settings
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="size-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-400">Failed to load dashboard data</p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto border-red-200 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-1 size-3" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <KPICard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            icon={kpi.icon}
            color={kpi.color}
            bgColor={kpi.bgColor}
            loading={loading}
          />
        ))}
      </div>

      <Separator />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipment Trends - Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shipment Trends</CardTitle>
            <CardDescription>Monthly shipment volume over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data?.shipmentTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Shipments"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10b981' }}
                    activeDot={{ r: 6, fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue vs Expenses - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
            <CardDescription>Monthly financial comparison over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.revenueTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    name="Expenses"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Expense Breakdown - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expense Breakdown</CardTitle>
            <CardDescription>Distribution of expenses by type (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full rounded-lg" />
            ) : expenseBreakdownData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={expenseBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={true}
                  >
                    {expenseBreakdownData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No expense data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Country-wise Shipments - Horizontal Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Country-wise Shipments</CardTitle>
            <CardDescription>Top 10 countries by shipment count</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full rounded-lg" />
            ) : countryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={countryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis
                    dataKey="country"
                    type="category"
                    tick={{ fontSize: 12 }}
                    width={40}
                    className="text-muted-foreground"
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    name="Shipments"
                    fill="#14b8a6"
                    radius={[0, 4, 4, 0]}
                  >
                    {countryData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No country data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Customers Chart - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Customers by Revenue</CardTitle>
          <CardDescription>Highest revenue-generating customers</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[280px] w-full rounded-lg" />
          ) : topCustomersData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topCustomersData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                >
                  {topCustomersData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No customer revenue data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Recent Activity Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest activities across your logistics operations</CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              <Clock className="mr-1 size-3" />
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
                >
                  <Skeleton className="size-10 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="size-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No recent activity</p>
              <p className="text-xs text-muted-foreground mt-1">
                Activity will appear here as shipments and voyages are created
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                onClick={() => navigateTo('shipments')}
              >
                <Plus className="mr-1 size-3" />
                Create First Shipment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
