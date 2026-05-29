'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Ship,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  MapPin,
  Calendar,
  Anchor,
  Box,
  Banknote,
  CreditCard,
  TrendingUp,
  DollarSign,
  Container,
  Thermometer,
  FileDown,
  ChevronsUpDown,
  Check,
  Weight,
  Hash,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { useNavigationStore } from '@/lib/store'
import { VoyageForm } from './voyage-form'
import { ChargeTypeCombobox } from '@/components/erp/shipment/charge-type-combobox'

const statusConfig: Record<string, { label: string; color: string; step: number }> = {
  planned: { label: 'Planned', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', step: 0 },
  loading: { label: 'Loading', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', step: 1 },
  departed: { label: 'Departed', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', step: 2 },
  in_transit: { label: 'In Transit', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', step: 3 },
  arrived: { label: 'Arrived', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', step: 4 },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', step: 5 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', step: -1 },
}

const statusSteps = ['Planned', 'Loading', 'Departed', 'In Transit', 'Arrived', 'Completed']

const REVENUE_TYPES = [
  { value: 'freight_income', label: 'Freight Income' },
  { value: 'slot_revenue', label: 'Slot Revenue' },
  { value: 'surcharges', label: 'Surcharges' },
  { value: 'handling_income', label: 'Handling Income' },
  { value: 'service_charges', label: 'Service Charges' },
]

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

const PIE_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#6366f1', '#ec4899', '#14b8a6']

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface VoyageDetail {
  id: string
  voyageNumber: string
  vesselName: string
  sailingRoute: string | null
  departurePort: string | null
  arrivalPort: string | null
  etd: string | null
  eta: string | null
  shippingLine: string | null
  status: string
  remarks: string | null
  teuRecords: Array<{
    id: string
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
  revenues: Array<{
    id: string
    revenueType: string
    customerId: string | null
    customer: { id: string; name: string; code: string } | null
    currency: string
    amount: number
    quantity: number
    weight: number | null
    description: string | null
    invoiceNumber: string | null
    paymentStatus: string
    dueDate: string | null
    revenueDate: string
  }>
  expenses: Array<{
    id: string
    expenseType: string
    vendorId: string | null
    vendor: { id: string; name: string } | null
    currency: string
    amount: number
    quantity: number
    weight: number | null
    description: string | null
    invoiceNumber: string | null
    paymentStatus: string
    expenseDate: string
  }>
}

interface ProfitData {
  totalRevenue: number
  totalExpense: number
  netProfit: number
  profitMargin: number
  profitPerTEU: number
  revenuePerTEU: number
  expensePerTEU: number
  expenseByType: Record<string, number>
  revenueByType: Record<string, number>
}

export function VoyageDetail() {
  const { selectedVoyageId, goBack } = useNavigationStore()
  const [voyage, setVoyage] = useState<VoyageDetail | null>(null)
  const [profit, setProfit] = useState<ProfitData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // TEU form
  const [showTeuForm, setShowTeuForm] = useState(false)
  const [teuForm, setTeuForm] = useState({
    totalContainers: '',
    totalTEUs: '',
    loadedTEUs: '',
    emptyTEUs: '',
    twentyFoot: '',
    fortyFoot: '',
    fortyFiveFoot: '',
    reeferUnits: '',
    specialUnits: '',
  })

  // Revenue form
  const [showRevenueForm, setShowRevenueForm] = useState(false)
  const [editingRevenue, setEditingRevenue] = useState<any>(null)
  const [revenueForm, setRevenueForm] = useState({
    revenueType: 'freight_income',
    customerId: '',
    currency: '',
    amount: '',
    quantity: '1',
    weight: '',
    description: '',
    invoiceNumber: '',
    paymentStatus: 'pending',
    dueDate: '',
  })
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false)

  // Expense form
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [expenseForm, setExpenseForm] = useState({
    expenseType: 'ocean_freight',
    vendorId: '',
    currency: '',
    amount: '',
    quantity: '1',
    weight: '',
    description: '',
    invoiceNumber: '',
    paymentStatus: 'pending',
  })

  // Vendors for expense form
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>([])
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; code: string }>>([])
  const [currencies, setCurrencies] = useState<Array<{ code: string; name: string; symbol: string }>>([])
  const [baseCurrency, setBaseCurrency] = useState('USD')
  const [submitting, setSubmitting] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [deletingItem, setDeletingItem] = useState<{ type: string; id: string } | null>(null)
  const [containerPrices, setContainerPrices] = useState<Record<string, string>>({})
  const [containers, setContainers] = useState<Array<{ id: string; containerNumber: string; containerType: string; containerSize: string; quantity: number; status: string }>>([])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: baseCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleDownloadPdf = async () => {
    if (!selectedVoyageId) return
    setDownloadingPdf(true)
    try {
      const res = await fetch(`/api/voyages/${selectedVoyageId}/pdf`)
      if (!res.ok) throw new Error('Failed to generate PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `voyage-${voyage?.voyageNumber || 'summary'}-report.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      console.error('Failed to download PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const fetchVoyage = useCallback(async () => {
    if (!selectedVoyageId) return
    setLoading(true)
    try {
      const [voyageRes, profitRes] = await Promise.all([
        fetch(`/api/voyages/${selectedVoyageId}`),
        fetch(`/api/voyages/${selectedVoyageId}/profit`),
      ])
      const voyageData = await voyageRes.json()
      const profitData = await profitRes.json()
      if (voyageData.success) setVoyage(voyageData.data)
      if (profitData.success) setProfit(profitData.data)
    } catch {
      console.error('Failed to fetch voyage')
    } finally {
      setLoading(false)
    }
  }, [selectedVoyageId])

  const fetchVendors = useCallback(async () => {
    try {
      const res = await fetch('/api/vendors?limit=100')
      const data = await res.json()
      if (data.success) setVendors(data.data || [])
    } catch {
      console.error('Failed to fetch vendors')
    }
  }, [])

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers?limit=100')
      const data = await res.json()
      if (data.success) setCustomers(data.data || [])
    } catch {
      console.error('Failed to fetch customers')
    }
  }, [])

  useEffect(() => {
    fetchVoyage()
  }, [fetchVoyage])

  useEffect(() => {
    fetchVendors()
    fetchCustomers()
    fetch('/api/currencies?isActive=true')
      .then(r => r.json())
      .then(json => { if (json.success) setCurrencies(json.data || []) })
      .catch(() => {})
    fetch('/api/settings')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data?.baseCurrency) setBaseCurrency(json.data.baseCurrency)
      })
      .catch(() => {})
  }, [fetchVendors, fetchCustomers])

  const handleAddTeu = async () => {
    if (!selectedVoyageId) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/voyages/${selectedVoyageId}/teu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalContainers: Number(teuForm.totalContainers) || 0,
          totalTEUs: Number(teuForm.totalTEUs) || 0,
          loadedTEUs: Number(teuForm.loadedTEUs) || 0,
          emptyTEUs: Number(teuForm.emptyTEUs) || 0,
          twentyFoot: Number(teuForm.twentyFoot) || 0,
          fortyFoot: Number(teuForm.fortyFoot) || 0,
          fortyFiveFoot: Number(teuForm.fortyFiveFoot) || 0,
          reeferUnits: Number(teuForm.reeferUnits) || 0,
          specialUnits: Number(teuForm.specialUnits) || 0,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowTeuForm(false)
        setTeuForm({ totalContainers: '', totalTEUs: '', loadedTEUs: '', emptyTEUs: '', twentyFoot: '', fortyFoot: '', fortyFiveFoot: '', reeferUnits: '', specialUnits: '' })
        fetchVoyage()
      }
    } catch {
      console.error('Failed to add TEU record')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddRevenue = async () => {
    if (!selectedVoyageId) return
    setSubmitting(true)
    try {
      const body = {
        ...revenueForm,
        customerId: revenueForm.customerId || null,
        amount: Number(revenueForm.amount) || 0,
        quantity: Number(revenueForm.quantity) || 1,
        weight: revenueForm.weight ? Number(revenueForm.weight) : null,
        dueDate: revenueForm.dueDate || null,
      }
      const res = await fetch(
        editingRevenue
          ? `/api/voyages/${selectedVoyageId}/revenues/${editingRevenue.id}`
          : `/api/voyages/${selectedVoyageId}/revenues`,
        {
          method: editingRevenue ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )
      const data = await res.json()
      if (data.success) {
        setShowRevenueForm(false)
        setEditingRevenue(null)
        setContainerPrices({})
        setRevenueForm({ revenueType: 'freight_income', customerId: '', currency: baseCurrency, amount: '', quantity: '1', weight: '', description: '', invoiceNumber: '', paymentStatus: 'pending', dueDate: '' })
        fetchVoyage()
      }
    } catch {
      console.error('Failed to add revenue')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddExpense = async () => {
    if (!selectedVoyageId) return
    setSubmitting(true)
    try {
      const body = {
        ...expenseForm,
        vendorId: expenseForm.vendorId || null,
        amount: Number(expenseForm.amount) || 0,
        quantity: Number(expenseForm.quantity) || 1,
        weight: expenseForm.weight ? Number(expenseForm.weight) : null,
      }
      const res = await fetch(
        editingExpense
          ? `/api/voyages/${selectedVoyageId}/expenses/${editingExpense.id}`
          : `/api/voyages/${selectedVoyageId}/expenses`,
        {
          method: editingExpense ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )
      const data = await res.json()
      if (data.success) {
        setShowExpenseForm(false)
        setEditingExpense(null)
        setExpenseForm({ expenseType: 'ocean_freight', vendorId: '', currency: baseCurrency, amount: '', quantity: '1', weight: '', description: '', invoiceNumber: '', paymentStatus: 'pending' })
        fetchVoyage()
      }
    } catch {
      console.error('Failed to add expense')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteVoyage = async () => {
    if (!selectedVoyageId) return
    try {
      await fetch(`/api/voyages/${selectedVoyageId}`, { method: 'DELETE' })
      goBack()
    } catch {
      console.error('Failed to delete voyage')
    }
  }

  const fetchContainers = useCallback(async () => {
    if (!voyage?.voyageNumber) return
    try {
      const res = await fetch(`/api/shipments?voyageNumber=${encodeURIComponent(voyage.voyageNumber)}`)
      const json = await res.json()
      if (json.success && json.data?.length > 0) {
        const allContainers = json.data.flatMap((s: any) => s.containers || [])
        setContainers(allContainers)
      }
    } catch {
      console.error('Failed to fetch containers')
    }
  }, [voyage?.voyageNumber])

  useEffect(() => {
    if (voyage?.voyageNumber) fetchContainers()
  }, [voyage?.voyageNumber, fetchContainers])

  const handleDeleteRevenue = async (revenueId: string) => {
    if (!selectedVoyageId) return
    try {
      const res = await fetch(`/api/voyages/${selectedVoyageId}/revenues/${revenueId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setDeletingItem(null)
        fetchVoyage()
      }
    } catch {
      console.error('Failed to delete revenue')
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!selectedVoyageId) return
    try {
      const res = await fetch(`/api/voyages/${selectedVoyageId}/expenses/${expenseId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setDeletingItem(null)
        fetchVoyage()
      }
    } catch {
      console.error('Failed to delete expense')
    }
  }

  const toggleRevenuePaymentStatus = async (revenue: any) => {
    if (!selectedVoyageId) return
    const cycle: Record<string, string> = { pending: 'partial', partial: 'paid', paid: 'overdue', overdue: 'pending' }
    const nextStatus = cycle[revenue.paymentStatus] || 'pending'
    try {
      await fetch(`/api/voyages/${selectedVoyageId}/revenues/${revenue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: nextStatus }),
      })
      fetchVoyage()
    } catch {
      console.error('Failed to toggle payment status')
    }
  }

  const toggleExpensePaymentStatus = async (expense: any) => {
    if (!selectedVoyageId) return
    const cycle: Record<string, string> = { pending: 'partial', partial: 'paid', paid: 'pending' }
    const nextStatus = cycle[expense.paymentStatus] || 'pending'
    try {
      await fetch(`/api/voyages/${selectedVoyageId}/expenses/${expense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: nextStatus }),
      })
      fetchVoyage()
    } catch {
      console.error('Failed to toggle payment status')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!voyage) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Anchor className="size-12 mb-4 opacity-40" />
        <p>Voyage not found</p>
        <Button variant="outline" onClick={goBack} className="mt-4">
          <ArrowLeft className="size-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  const status = statusConfig[voyage.status] || statusConfig.planned
  const currentStep = status.step >= 0 ? status.step : 0
  const latestTeu = voyage.teuRecords.length > 0 ? voyage.teuRecords[0] : null
  const totalRevenue = voyage.revenues.reduce((s, r) => s + (r.amount || 0), 0)
  const totalExpenses = voyage.expenses.reduce((s, e) => s + (e.amount || 0), 0)

  const revenueByTypeData = Object.entries(profit?.revenueByType || {}).map(([key, value]) => ({
    name: REVENUE_TYPES.find(t => t.value === key)?.label || key,
    value: Math.round(value),
  }))

  const expenseByTypeData = Object.entries(profit?.expenseByType || {}).map(([key, value]) => ({
    name: EXPENSE_TYPES.find(t => t.value === key)?.label || key,
    value: Math.round(value),
  }))

  const revExpChart = [
    { name: 'Revenue', value: Math.round(totalRevenue), fill: '#10b981' },
    { name: 'Expenses', value: Math.round(totalExpenses), fill: '#ef4444' },
  ]

  const revenueChartConfig: ChartConfig = {
    Revenue: { label: 'Revenue', color: '#10b981' },
    Expenses: { label: 'Expenses', color: '#ef4444' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goBack} className="h-9 w-9 p-0">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="rounded-xl p-2.5 bg-amber-50 dark:bg-amber-950/30">
            <Ship className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{voyage.voyageNumber}</h1>
              <Badge variant="secondary" className={status.color}>{status.label}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">{voyage.vesselName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={downloadingPdf}>
            {downloadingPdf ? <Loader2 className="size-4 mr-2 animate-spin" /> : <FileDown className="size-4 mr-2" />}
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil className="size-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteVoyage}>
            <Trash2 className="size-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teu">TEU</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="profit">Profit</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Voyage Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Vessel</CardDescription>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Ship className="size-4 text-amber-600" />
                  {voyage.vesselName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Shipping Line: {voyage.shippingLine || '—'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Route</CardDescription>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="size-4 text-amber-600" />
                  {voyage.sailingRoute || '—'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {voyage.departurePort || '—'} → {voyage.arrivalPort || '—'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Schedule</CardDescription>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="size-4 text-amber-600" />
                  {formatDate(voyage.etd)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">ETA: {formatDate(voyage.eta)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2 bg-amber-50 dark:bg-amber-950/30">
                    <Box className="size-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total TEUs</p>
                    <p className="text-xl font-bold">{latestTeu?.totalTEUs ?? 0}</p>
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
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2 bg-red-50 dark:bg-red-950/30">
                    <CreditCard className="size-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expenses</p>
                    <p className="text-xl font-bold">{formatCurrency(totalExpenses)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${(totalRevenue - totalExpenses) >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                    <DollarSign className={`size-4 ${(totalRevenue - totalExpenses) >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Net Profit</p>
                    <p className={`text-xl font-bold ${(totalRevenue - totalExpenses) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(totalRevenue - totalExpenses)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {voyage.status === 'cancelled' ? (
                <div className="flex items-center gap-2 text-red-600">
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Cancelled</Badge>
                </div>
              ) : (
                <div className="flex items-center gap-1 overflow-x-auto pb-2">
                  {statusSteps.map((step, i) => (
                    <React.Fragment key={step}>
                      <div className="flex flex-col items-center min-w-[70px]">
                        <div className={`size-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                          i <= currentStep
                            ? 'bg-amber-500 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {i + 1}
                        </div>
                        <span className={`text-xs mt-1 ${
                          i <= currentStep ? 'text-amber-600 font-medium' : 'text-muted-foreground'
                        }`}>
                          {step}
                        </span>
                      </div>
                      {i < statusSteps.length - 1 && (
                        <div className={`h-0.5 w-8 flex-shrink-0 ${
                          i < currentStep ? 'bg-amber-500' : 'bg-muted'
                        }`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Remarks */}
          {voyage.remarks && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Remarks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{voyage.remarks}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TEU Tab */}
        <TabsContent value="teu" className="space-y-6 mt-6">
          {/* TEU Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total Containers</p>
                <p className="text-2xl font-bold">{latestTeu?.totalContainers ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total TEUs</p>
                <p className="text-2xl font-bold">{latestTeu?.totalTEUs ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Loaded TEUs</p>
                <p className="text-2xl font-bold text-emerald-600">{latestTeu?.loadedTEUs ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Empty TEUs</p>
                <p className="text-2xl font-bold text-gray-500">{latestTeu?.emptyTEUs ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Utilization</p>
                <p className="text-2xl font-bold text-amber-600">
                  {latestTeu?.teuUtilization ? `${latestTeu.teuUtilization.toFixed(1)}%` : '0%'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Utilization Progress */}
          {latestTeu && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">TEU Utilization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={latestTeu.teuUtilization || 0} className="h-4" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Loaded: {latestTeu.loadedTEUs} TEUs</span>
                  <span>Empty: {latestTeu.emptyTEUs} TEUs</span>
                  <span>Total: {latestTeu.totalTEUs} TEUs</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Container Breakdown */}
          {latestTeu && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Container className="size-6 mx-auto text-blue-500 mb-1" />
                  <p className="text-xs text-muted-foreground">20ft</p>
                  <p className="text-lg font-bold">{latestTeu.twentyFoot}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Container className="size-6 mx-auto text-indigo-500 mb-1" />
                  <p className="text-xs text-muted-foreground">40ft</p>
                  <p className="text-lg font-bold">{latestTeu.fortyFoot}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Container className="size-6 mx-auto text-violet-500 mb-1" />
                  <p className="text-xs text-muted-foreground">45ft</p>
                  <p className="text-lg font-bold">{latestTeu.fortyFiveFoot}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Thermometer className="size-6 mx-auto text-cyan-500 mb-1" />
                  <p className="text-xs text-muted-foreground">Reefer</p>
                  <p className="text-lg font-bold">{latestTeu.reeferUnits}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Box className="size-6 mx-auto text-orange-500 mb-1" />
                  <p className="text-xs text-muted-foreground">Special</p>
                  <p className="text-lg font-bold">{latestTeu.specialUnits}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TEU Records Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">TEU Records</CardTitle>
                <CardDescription>Historical TEU allocation records</CardDescription>
              </div>
              <Button onClick={() => setShowTeuForm(true)} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                <Plus className="size-4 mr-2" />
                Add TEU Record
              </Button>
            </CardHeader>
            <CardContent>
              {voyage.teuRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Box className="size-8 mx-auto mb-2 opacity-40" />
                  <p>No TEU records yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Containers</TableHead>
                        <TableHead className="text-right">Total TEUs</TableHead>
                        <TableHead className="text-right">Loaded</TableHead>
                        <TableHead className="text-right">Empty</TableHead>
                        <TableHead className="text-right">20ft</TableHead>
                        <TableHead className="text-right">40ft</TableHead>
                        <TableHead className="text-right">45ft</TableHead>
                        <TableHead className="text-right">Reefer</TableHead>
                        <TableHead className="text-right">Special</TableHead>
                        <TableHead className="text-right">Utilization</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {voyage.teuRecords.map((rec) => (
                        <TableRow key={rec.id}>
                          <TableCell className="text-sm">{formatDate(rec.recordedAt)}</TableCell>
                          <TableCell className="text-right font-mono">{rec.totalContainers}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">{rec.totalTEUs}</TableCell>
                          <TableCell className="text-right font-mono text-emerald-600">{rec.loadedTEUs}</TableCell>
                          <TableCell className="text-right font-mono text-gray-500">{rec.emptyTEUs}</TableCell>
                          <TableCell className="text-right font-mono">{rec.twentyFoot}</TableCell>
                          <TableCell className="text-right font-mono">{rec.fortyFoot}</TableCell>
                          <TableCell className="text-right font-mono">{rec.fortyFiveFoot}</TableCell>
                          <TableCell className="text-right font-mono">{rec.reeferUnits}</TableCell>
                          <TableCell className="text-right font-mono">{rec.specialUnits}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              {rec.teuUtilization ? `${rec.teuUtilization.toFixed(1)}%` : '0%'}
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
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6 mt-6">
          {/* Revenue Summary — spreadsheet-style breakdown */}
          {voyage.revenues.length > 0 && (() => {
            // Group revenues by type
            const revenuesByType: Record<string, { total: number; byCurrency: Record<string, number> }> = {}
            voyage.revenues.forEach((rev) => {
              const type = rev.revenueType
              if (!revenuesByType[type]) {
                revenuesByType[type] = { total: 0, byCurrency: {} }
              }
              revenuesByType[type].total += rev.amount || 0
              if (!revenuesByType[type].byCurrency[rev.currency]) {
                revenuesByType[type].byCurrency[rev.currency] = 0
              }
              revenuesByType[type].byCurrency[rev.currency] += rev.amount
            })

            // Get unique currencies across all revenues
            const allCurrencies = [...new Set(voyage.revenues.map(r => r.currency))].sort()

            // Sort revenue types by total descending
            const sortedTypes = Object.entries(revenuesByType).sort(([, a], [, b]) => b.total - a.total)

            // Calculate totals per currency
            const totalsByCurrency: Record<string, number> = {}
            allCurrencies.forEach(c => { totalsByCurrency[c] = 0 })
            let grandTotal = 0
            sortedTypes.forEach(([, data]) => {
              grandTotal += data.total
              allCurrencies.forEach(c => {
                totalsByCurrency[c] += data.byCurrency[c] || 0
              })
            })

            return (
              <Card className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-emerald-50 dark:bg-emerald-950/30">
                      <Banknote className="size-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Revenue Summary</CardTitle>
                      <CardDescription>Revenue breakdown by type — {voyage.voyageNumber}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                          <TableHead className="font-bold text-emerald-900 dark:text-emerald-100 pl-6 min-w-[200px]">TYPE</TableHead>
                          <TableHead className="font-bold text-emerald-900 dark:text-emerald-100 text-right min-w-[140px]">REVENUE</TableHead>
                          {allCurrencies.map(c => (
                            <TableHead key={c} className="font-bold text-emerald-900 dark:text-emerald-100 text-right min-w-[130px]">
                              {c} AMOUNT
                            </TableHead>
                          ))}
                          <TableHead className="font-bold text-emerald-900 dark:text-emerald-100 text-right min-w-[100px]">% OF TOTAL</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedTypes.map(([type, data], idx) => {
                          const label = REVENUE_TYPES.find(t => t.value === type)?.label || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                          const pct = grandTotal > 0 ? (data.total / grandTotal) * 100 : 0
                          return (
                            <TableRow
                              key={type}
                              className={idx % 2 === 0 ? 'bg-muted/30 hover:bg-muted/40' : 'hover:bg-muted/40'}
                            >
                              <TableCell className="font-medium pl-6">
                                <div className="flex items-center gap-2">
                                  <div className="size-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                                  {label}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold">
                                {formatCurrency(data.total)}
                              </TableCell>
                              {allCurrencies.map(c => (
                                <TableCell key={c} className="text-right font-mono">
                                  {data.byCurrency[c]
                                    ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(data.byCurrency[c])
                                    : '—'
                                  }
                                </TableCell>
                              ))}
                              <TableCell className="text-right">
                                <Badge
                                  variant="secondary"
                                  className={
                                    pct > 50
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                      : pct > 25
                                        ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                  }
                                >
                                  {pct.toFixed(1)}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {/* TOTAL ROW — highlighted */}
                        <TableRow className="bg-emerald-500 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-600 border-t-2 border-emerald-600">
                          <TableCell className="font-bold text-white pl-6 text-base">
                            TOTAL
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-white text-base">
                            {formatCurrency(grandTotal)}
                          </TableCell>
                          {allCurrencies.map(c => (
                            <TableCell key={c} className="text-right font-mono font-bold text-white text-base">
                              {new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalsByCurrency[c] || 0)}
                            </TableCell>
                          ))}
                          <TableCell className="text-right font-bold text-white text-base">
                            100%
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  {/* Summary bar below table */}
                  <div className="px-6 py-4 bg-emerald-50 dark:bg-emerald-950/20 border-t border-emerald-200 dark:border-emerald-800">
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Revenue Types: </span>
                        <span className="font-semibold">{sortedTypes.length}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Currencies: </span>
                        <span className="font-semibold">{allCurrencies.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Revenue: </span>
                        <span className="font-bold text-emerald-600">{formatCurrency(grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Revenue Records</CardTitle>
                <CardDescription>Track income from voyage operations</CardDescription>
              </div>
              <Button onClick={() => {
                setEditingRevenue(null)
                setContainerPrices({})
                setRevenueForm({ revenueType: 'freight_income', customerId: '', currency: baseCurrency, amount: '', quantity: '1', weight: '', description: '', invoiceNumber: '', paymentStatus: 'pending', dueDate: '' })
                setShowRevenueForm(true)
              }} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                <Plus className="size-4 mr-2" />
                Add Revenue
              </Button>
            </CardHeader>
            <CardContent>
              {voyage.revenues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Banknote className="size-8 mx-auto mb-2 opacity-40" />
                  <p>No revenue records yet</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="tracking-wider text-[11px]">TYPE</TableHead>
                          <TableHead className="tracking-wider text-[11px]">CUSTOMER</TableHead>
                          <TableHead className="tracking-wider text-[11px]">CURRENCY</TableHead>
                          <TableHead className="text-right tracking-wider text-[11px]">AMOUNT</TableHead>
                          <TableHead className="text-right tracking-wider text-[11px]">QTY</TableHead>
                          <TableHead className="text-right tracking-wider text-[11px]">WEIGHT</TableHead>
                          <TableHead className="tracking-wider text-[11px]">INVOICE</TableHead>
                          <TableHead className="tracking-wider text-[11px]">DUE DATE</TableHead>
                          <TableHead className="tracking-wider text-[11px]">STATUS</TableHead>
                          <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {voyage.revenues.map((rev) => (
                          <TableRow key={rev.id}>
                            <TableCell>
                              <span className="text-xs font-medium uppercase tracking-wide">
                                {REVENUE_TYPES.find(t => t.value === rev.revenueType)?.label || rev.revenueType}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{rev.customer?.name || '—'}</TableCell>
                            <TableCell className="font-mono text-sm">{rev.currency}</TableCell>
                            <TableCell className="text-right font-mono font-semibold">{rev.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono">{rev.quantity}</TableCell>
                            <TableCell className="text-right font-mono text-muted-foreground">{rev.weight ? `${rev.weight} kg` : '—'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{rev.invoiceNumber || '—'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(rev.dueDate)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`cursor-pointer text-xs ${
                                  rev.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                  rev.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  rev.paymentStatus === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                }`}
                                onClick={() => toggleRevenuePaymentStatus(rev)}
                              >
                                {rev.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7"
                                  onClick={() => {
                                    setEditingRevenue(rev)
                                    setRevenueForm({
                                      revenueType: rev.revenueType,
                                      customerId: rev.customerId || '',
                                      currency: rev.currency,
                                      amount: rev.amount.toString(),
                                      quantity: rev.quantity.toString(),
                                      weight: rev.weight?.toString() || '',
                                      description: rev.description || '',
                                      invoiceNumber: rev.invoiceNumber || '',
                                      paymentStatus: rev.paymentStatus,
                                      dueDate: rev.dueDate?.split('T')[0] || '',
                                    })
                                    setShowRevenueForm(true)
                                  }}
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-red-500 hover:text-red-600"
                                  onClick={() => setDeletingItem({ type: 'revenue', id: rev.id })}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-end">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6 mt-6">
          {/* Voyage Cost Summary — similar to spreadsheet-style breakdown */}
          {voyage.expenses.length > 0 && (() => {
            // Group expenses by type
            const expensesByType: Record<string, { total: number; byCurrency: Record<string, number> }> = {}
            voyage.expenses.forEach((exp) => {
              const type = exp.expenseType
              if (!expensesByType[type]) {
                expensesByType[type] = { total: 0, byCurrency: {} }
              }
              expensesByType[type].total += exp.amount || 0
              if (!expensesByType[type].byCurrency[exp.currency]) {
                expensesByType[type].byCurrency[exp.currency] = 0
              }
              expensesByType[type].byCurrency[exp.currency] += exp.amount
            })

            // Get unique currencies across all expenses
            const allCurrencies = [...new Set(voyage.expenses.map(e => e.currency))].sort()

            // Sort expense types by total descending
            const sortedTypes = Object.entries(expensesByType).sort(([, a], [, b]) => b.total - a.total)

            // Calculate totals per currency
            const totalsByCurrency: Record<string, number> = {}
            allCurrencies.forEach(c => { totalsByCurrency[c] = 0 })
            let grandTotal = 0
            sortedTypes.forEach(([, data]) => {
              grandTotal += data.total
              allCurrencies.forEach(c => {
                totalsByCurrency[c] += data.byCurrency[c] || 0
              })
            })

            return (
              <Card className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg p-2 bg-amber-50 dark:bg-amber-950/30">
                        <CreditCard className="size-5 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Voyage Cost Summary</CardTitle>
                        <CardDescription>Cost breakdown by expense category — {voyage.voyageNumber}</CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={downloadingPdf}>
                      {downloadingPdf ? <Loader2 className="size-4 mr-2 animate-spin" /> : <FileDown className="size-4 mr-2" />}
                      Export PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-50 dark:hover:bg-amber-950/30">
                          <TableHead className="font-bold text-amber-900 dark:text-amber-100 pl-6 min-w-[200px]">TYPE</TableHead>
                          <TableHead className="font-bold text-amber-900 dark:text-amber-100 text-right min-w-[140px]">COSTS</TableHead>
                          {allCurrencies.map(c => (
                            <TableHead key={c} className="font-bold text-amber-900 dark:text-amber-100 text-right min-w-[130px]">
                              {c} AMOUNT
                            </TableHead>
                          ))}
                          <TableHead className="font-bold text-amber-900 dark:text-amber-100 text-right min-w-[100px]">% OF TOTAL</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedTypes.map(([type, data], idx) => {
                          const label = EXPENSE_TYPES.find(t => t.value === type)?.label || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                          const pct = grandTotal > 0 ? (data.total / grandTotal) * 100 : 0
                          const isHighlight = type === 'agency_costs' || type === 'crew_costs' || type === 'miscellaneous'
                          return (
                            <TableRow
                              key={type}
                              className={
                                isHighlight
                                  ? 'bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-50 dark:hover:bg-yellow-950/20'
                                  : idx % 2 === 0
                                    ? 'bg-muted/30 hover:bg-muted/40'
                                    : 'hover:bg-muted/40'
                              }
                            >
                              <TableCell className="font-medium pl-6">
                                <div className="flex items-center gap-2">
                                  <div className="size-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                                  {label}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold">
                                {formatCurrency(data.total)}
                              </TableCell>
                              {allCurrencies.map(c => (
                                <TableCell key={c} className="text-right font-mono">
                                  {data.byCurrency[c]
                                    ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(data.byCurrency[c])
                                    : '—'
                                  }
                                </TableCell>
                              ))}
                              <TableCell className="text-right">
                                <Badge
                                  variant="secondary"
                                  className={
                                    pct > 30
                                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                      : pct > 15
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  }
                                >
                                  {pct.toFixed(1)}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {/* TOTAL ROW — highlighted */}
                        <TableRow className="bg-amber-500 hover:bg-amber-500 dark:bg-amber-600 dark:hover:bg-amber-600 border-t-2 border-amber-600">
                          <TableCell className="font-bold text-white pl-6 text-base">
                            TOTAL
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-white text-base">
                            {formatCurrency(grandTotal)}
                          </TableCell>
                          {allCurrencies.map(c => (
                            <TableCell key={c} className="text-right font-mono font-bold text-white text-base">
                              {new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalsByCurrency[c] || 0)}
                            </TableCell>
                          ))}
                          <TableCell className="text-right font-bold text-white text-base">
                            100%
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  {/* Summary bar below table */}
                  <div className="px-6 py-4 bg-amber-50 dark:bg-amber-950/20 border-t border-amber-200 dark:border-amber-800">
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Expense Categories: </span>
                        <span className="font-semibold">{sortedTypes.length}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Currencies: </span>
                        <span className="font-semibold">{allCurrencies.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Cost: </span>
                        <span className="font-bold text-red-600">{formatCurrency(grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          {/* Revenue vs Expense Comparison Summary */}
          {voyage.expenses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2.5 bg-emerald-50 dark:bg-emerald-950/30">
                      <TrendingUp className="size-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Revenue</p>
                      <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-200 dark:border-red-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2.5 bg-red-50 dark:bg-red-950/30">
                      <CreditCard className="size-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Expenses</p>
                      <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className={(totalRevenue - totalExpenses) >= 0 ? 'border-emerald-200 dark:border-emerald-800' : 'border-red-200 dark:border-red-800'}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2.5 ${(totalRevenue - totalExpenses) >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                      <DollarSign className={`size-5 ${(totalRevenue - totalExpenses) >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Net {totalRevenue - totalExpenses >= 0 ? 'Profit' : 'Loss'}</p>
                      <p className={`text-xl font-bold ${(totalRevenue - totalExpenses) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(totalRevenue - totalExpenses)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Expense Records</CardTitle>
                <CardDescription>Track costs for voyage operations</CardDescription>
              </div>
              <Button onClick={() => {
                setEditingExpense(null)
                setExpenseForm({ expenseType: 'ocean_freight', vendorId: '', currency: baseCurrency, amount: '', quantity: '1', weight: '', description: '', invoiceNumber: '', paymentStatus: 'pending' })
                setShowExpenseForm(true)
              }} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                <Plus className="size-4 mr-2" />
                Add Expense
              </Button>
            </CardHeader>
            <CardContent>
              {voyage.expenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="size-8 mx-auto mb-2 opacity-40" />
                  <p>No expense records yet</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="tracking-wider text-[11px]">TYPE</TableHead>
                          <TableHead className="tracking-wider text-[11px]">VENDOR</TableHead>
                          <TableHead className="tracking-wider text-[11px]">CURRENCY</TableHead>
                          <TableHead className="text-right tracking-wider text-[11px]">AMOUNT</TableHead>
                          <TableHead className="text-right tracking-wider text-[11px]">QTY</TableHead>
                          <TableHead className="text-right tracking-wider text-[11px]">WEIGHT</TableHead>
                          <TableHead className="tracking-wider text-[11px]">INVOICE</TableHead>
                          <TableHead className="tracking-wider text-[11px]">STATUS</TableHead>
                          <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {voyage.expenses.map((exp) => (
                          <TableRow key={exp.id}>
                            <TableCell>
                              <span className="text-xs font-medium uppercase tracking-wide">
                                {EXPENSE_TYPES.find(t => t.value === exp.expenseType)?.label || exp.expenseType}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{exp.vendor?.name || '—'}</TableCell>
                            <TableCell className="font-mono text-sm">{exp.currency}</TableCell>
                            <TableCell className="text-right font-mono font-semibold">{exp.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono">{exp.quantity}</TableCell>
                            <TableCell className="text-right font-mono text-muted-foreground">{exp.weight ? `${exp.weight} kg` : '—'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{exp.invoiceNumber || '—'}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`cursor-pointer text-xs ${
                                  exp.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                  exp.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                }`}
                                onClick={() => toggleExpensePaymentStatus(exp)}
                              >
                                {exp.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7"
                                  onClick={() => {
                                    setEditingExpense(exp)
                                    setExpenseForm({
                                      expenseType: exp.expenseType,
                                      vendorId: exp.vendorId || '',
                                      currency: exp.currency,
                                      amount: exp.amount.toString(),
                                      quantity: exp.quantity.toString(),
                                      weight: exp.weight?.toString() || '',
                                      description: exp.description || '',
                                      invoiceNumber: exp.invoiceNumber || '',
                                      paymentStatus: exp.paymentStatus,
                                    })
                                    setShowExpenseForm(true)
                                  }}
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-red-500 hover:text-red-600"
                                  onClick={() => setDeletingItem({ type: 'expense', id: exp.id })}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-end">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit Tab */}
        <TabsContent value="profit" className="space-y-6 mt-6">
          {profit && (
            <>
              {/* Key Profit Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Gross Revenue</p>
                    <p className="text-3xl font-bold text-emerald-600">{formatCurrency(profit.totalRevenue)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
                    <p className="text-3xl font-bold text-red-600">{formatCurrency(profit.totalExpense)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
                    <p className={`text-3xl font-bold ${profit.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(profit.netProfit)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Per TEU Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Profit Per TEU</p>
                      <TrendingUp className="size-4 text-amber-600" />
                    </div>
                    <p className={`text-xl font-bold mt-1 ${profit.profitPerTEU >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(profit.profitPerTEU)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Revenue Per TEU</p>
                      <Banknote className="size-4 text-emerald-600" />
                    </div>
                    <p className="text-xl font-bold mt-1 text-emerald-600">{formatCurrency(profit.revenuePerTEU)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Profit Margin</p>
                      <DollarSign className="size-4 text-amber-600" />
                    </div>
                    <p className={`text-xl font-bold mt-1 ${profit.profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {profit.profitMargin.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue vs Expense Bar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revExpChart}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {revExpChart.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Revenue by Type Pie */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Revenue by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {revenueByTypeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={revenueByTypeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            dataKey="value"
                          >
                            {revenueByTypeData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        No revenue data
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Expense by Type Pie */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Expense Breakdown by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {expenseByTypeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={expenseByTypeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            dataKey="value"
                          >
                            {expenseByTypeData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        No expense data
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {showEdit && (
        <VoyageForm
          voyage={voyage}
          onClose={() => setShowEdit(false)}
          onSuccess={() => { setShowEdit(false); fetchVoyage() }}
        />
      )}

      {/* TEU Form Dialog */}
      <Dialog open={showTeuForm} onOpenChange={setShowTeuForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add TEU Record</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5">
              <Label>Total Containers</Label>
              <Input type="number" value={teuForm.totalContainers} onChange={(e) => setTeuForm(p => ({ ...p, totalContainers: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Total TEUs</Label>
              <Input type="number" value={teuForm.totalTEUs} onChange={(e) => setTeuForm(p => ({ ...p, totalTEUs: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Loaded TEUs</Label>
              <Input type="number" value={teuForm.loadedTEUs} onChange={(e) => setTeuForm(p => ({ ...p, loadedTEUs: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Empty TEUs</Label>
              <Input type="number" value={teuForm.emptyTEUs} onChange={(e) => setTeuForm(p => ({ ...p, emptyTEUs: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>20ft</Label>
              <Input type="number" value={teuForm.twentyFoot} onChange={(e) => setTeuForm(p => ({ ...p, twentyFoot: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>40ft</Label>
              <Input type="number" value={teuForm.fortyFoot} onChange={(e) => setTeuForm(p => ({ ...p, fortyFoot: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>45ft</Label>
              <Input type="number" value={teuForm.fortyFiveFoot} onChange={(e) => setTeuForm(p => ({ ...p, fortyFiveFoot: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Reefer Units</Label>
              <Input type="number" value={teuForm.reeferUnits} onChange={(e) => setTeuForm(p => ({ ...p, reeferUnits: e.target.value }))} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Special Units</Label>
              <Input type="number" value={teuForm.specialUnits} onChange={(e) => setTeuForm(p => ({ ...p, specialUnits: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowTeuForm(false)}>Cancel</Button>
            <Button onClick={handleAddTeu} disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white">
              {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Add Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revenue Form Dialog */}
      <Dialog open={showRevenueForm} onOpenChange={(open) => { if (!open) { setShowRevenueForm(false); setEditingRevenue(null) } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRevenue ? 'Edit Revenue' : 'Add Revenue'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Container Pricing */}
            {!editingRevenue && containers.length > 0 && (
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold tracking-wider uppercase">Container Pricing</h4>
                {Object.entries(
                  containers.reduce((acc, c) => {
                    const key = `${c.containerType}|${c.status}`
                    acc[key] = (acc[key] || 0) + (c.quantity || 1)
                    return acc
                  }, {} as Record<string, number>)
                ).map(([key, qty]) => {
                  const [type, status] = key.split('|')
                  const price = parseFloat(containerPrices[key] || '0') || 0
                  const subtotal = qty * price
                  return (
                    <div key={key} className="grid grid-cols-[1fr_auto_auto_1fr_auto] gap-2 items-center">
                      <span className="text-sm font-medium">{type}</span>
                      <Badge variant="secondary" className="text-xs">{status}</Badge>
                      <span className="text-sm text-muted-foreground">×{qty}</span>
                      <Input
                        type="number"
                        placeholder="Price"
                        value={containerPrices[key] || ''}
                        onChange={(e) => {
                          const v = e.target.value
                          const newPrices = { ...containerPrices, [key]: v }
                          setContainerPrices(newPrices)
                          const groups = containers.reduce((acc, c) => {
                            const k = `${c.containerType}|${c.status}`
                            acc[k] = (acc[k] || 0) + (c.quantity || 1)
                            return acc
                          }, {} as Record<string, number>)
                          const total = Object.entries(newPrices).reduce((sum, [k, p]) => {
                            return sum + (groups[k] || 0) * (parseFloat(p || '0') || 0)
                          }, 0)
                          setRevenueForm((prev) => ({ ...prev, amount: total ? total.toString() : '' }))
                        }}
                      />
                      <span className="text-sm text-right font-medium tabular-nums">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                  )
                })}
                <div className="flex justify-end pt-2 border-t">
                  <span className="text-sm font-semibold tabular-nums">
                    Total: {formatCurrency(
                      Object.entries(containerPrices).reduce((sum, [key, price]) => {
                        const qty = containers.reduce((s, c) => s + (`${c.containerType}|${c.status}` === key ? (c.quantity || 1) : 0), 0)
                        return sum + qty * (parseFloat(price || '0') || 0)
                      }, 0)
                    )}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider">Revenue Type</Label>
                <Select value={revenueForm.revenueType} onValueChange={(v) => setRevenueForm(p => ({ ...p, revenueType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REVENUE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider">Customer</Label>
                <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerPopoverOpen}
                      className="w-full justify-between font-normal"
                    >
                      {revenueForm.customerId
                        ? customers.find((c) => c.id === revenueForm.customerId)?.name || 'Select customer'
                        : 'Select customer'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-h-[300px] overflow-y-auto p-0">
                    <Command>
                      <CommandInput placeholder="Search customers..." />
                      <CommandList className="max-h-[260px]">
                        <CommandEmpty>No customers found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="_none"
                            onSelect={() => {
                              setRevenueForm({ ...revenueForm, customerId: '' })
                              setCustomerPopoverOpen(false)
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', !revenueForm.customerId ? 'opacity-100' : 'opacity-0')} />
                            No Customer
                          </CommandItem>
                          {customers.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={`${c.name} ${c.code}`}
                              onSelect={() => {
                                setRevenueForm({ ...revenueForm, customerId: c.id })
                                setCustomerPopoverOpen(false)
                              }}
                            >
                              <Check className={cn('mr-2 h-4 w-4', revenueForm.customerId === c.id ? 'opacity-100' : 'opacity-0')} />
                              {c.name} ({c.code})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider">Currency</Label>
                <Select value={revenueForm.currency || baseCurrency} onValueChange={(v) => setRevenueForm(p => ({ ...p, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider">Amount *</Label>
                <Input type="number" step="0.01" value={revenueForm.amount} onChange={(e) => setRevenueForm(p => ({ ...p, amount: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider">Quantity</Label>
                <Input type="number" min="1" value={revenueForm.quantity} onChange={(e) => setRevenueForm(p => ({ ...p, quantity: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider">Weight (kg)</Label>
                <Input type="number" step="0.1" value={revenueForm.weight} onChange={(e) => setRevenueForm(p => ({ ...p, weight: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider">Invoice Number</Label>
                <Input value={revenueForm.invoiceNumber} onChange={(e) => setRevenueForm(p => ({ ...p, invoiceNumber: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider">Due Date</Label>
                <Input type="date" value={revenueForm.dueDate} onChange={(e) => setRevenueForm(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider">Payment Status</Label>
                <Select value={revenueForm.paymentStatus} onValueChange={(v) => setRevenueForm(p => ({ ...p, paymentStatus: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider">Description</Label>
              <Textarea value={revenueForm.description} onChange={(e) => setRevenueForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setShowRevenueForm(false); setEditingRevenue(null); setContainerPrices({}) }}>Cancel</Button>
            <Button onClick={handleAddRevenue} disabled={submitting || !revenueForm.amount} className="bg-amber-600 hover:bg-amber-700 text-white">
              {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              {editingRevenue ? 'Update Revenue' : 'Add Revenue'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expense Form Dialog */}
      <Dialog open={showExpenseForm} onOpenChange={(open) => { if (!open) { setShowExpenseForm(false); setEditingExpense(null) } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider">Expense Type</Label>
                <ChargeTypeCombobox
                  type="expense"
                  value={expenseForm.expenseType}
                  onValueChange={(v) => setExpenseForm(p => ({ ...p, expenseType: v }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider">Vendor</Label>
                <Select value={expenseForm.vendorId} onValueChange={(v) => setExpenseForm(p => ({ ...p, vendorId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No vendor</SelectItem>
                    {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider">Currency</Label>
                <Select value={expenseForm.currency || baseCurrency} onValueChange={(v) => setExpenseForm(p => ({ ...p, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider">Amount *</Label>
                <Input type="number" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm(p => ({ ...p, amount: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider">Quantity</Label>
                <Input type="number" min="1" value={expenseForm.quantity} onChange={(e) => setExpenseForm(p => ({ ...p, quantity: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider">Weight (kg)</Label>
                <Input type="number" step="0.1" value={expenseForm.weight} onChange={(e) => setExpenseForm(p => ({ ...p, weight: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider">Invoice Number</Label>
                <Input value={expenseForm.invoiceNumber} onChange={(e) => setExpenseForm(p => ({ ...p, invoiceNumber: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider">Payment Status</Label>
                <Select value={expenseForm.paymentStatus} onValueChange={(v) => setExpenseForm(p => ({ ...p, paymentStatus: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider">Description</Label>
              <Textarea value={expenseForm.description} onChange={(e) => setExpenseForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setShowExpenseForm(false); setEditingExpense(null) }}>Cancel</Button>
            <Button onClick={handleAddExpense} disabled={submitting || !expenseForm.amount} className="bg-amber-600 hover:bg-amber-700 text-white">
              {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              {editingExpense ? 'Update Expense' : 'Add Expense'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this {deletingItem?.type}? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeletingItem(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingItem?.type === 'revenue') handleDeleteRevenue(deletingItem.id)
                else if (deletingItem?.type === 'expense') handleDeleteExpense(deletingItem.id)
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
