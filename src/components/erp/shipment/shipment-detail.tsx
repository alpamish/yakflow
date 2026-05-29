'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Ship,
  Plane,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Calendar,
  MapPin,
  Package,
  DollarSign,
  TrendingUp,
  Loader2,
  Container,
  Check,
  ChevronsUpDown,
  Search,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ChargeTypeCombobox } from '@/components/erp/shipment/charge-type-combobox'
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
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useNavigationStore } from '@/lib/store'
import { ShipmentForm } from './shipment-form'
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

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  booked: 'Booked',
  loading: 'Loading',
  in_transit: 'In Transit',
  arrived: 'Arrived',
  customs_clearance: 'Customs',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const containerStatusColors: Record<string, string> = {
  empty: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  loaded: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  in_transit: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
  arrived: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
}

const deliveryStatusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  picked_up: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  in_transit: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  returned: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
}

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  partial: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

const CHART_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#6366f1']

interface ShipmentData {
  id: string
  shipmentNumber: string
  direction: string
  transportMode: string
  customer: { id: string; name: string; code: string } | null
  shipper: string | null
  consignee: string | null
  notifyParty: string | null
  bookingNumber: string | null
  blNumber: string | null
  awbNumber: string | null
  cargoType: string | null
  imoClass: string | null
  originCountry: string | null
  destinationCountry: string | null
  portOfLoading: string | null
  portOfDischarge: string | null
  finalDestination: string | null
  etd: string | null
  eta: string | null
  vesselName: string | null
  voyageNumber: string | null
  freeDays: number | null
  status: string
  remarks: string | null
  containers: ContainerData[]
  expenses: ExpenseData[]
  revenues: RevenueData[]
}

interface ContainerData {
  id: string
  containerNumber: string
  containerType: string
  containerSize: string
  sealNumber: string | null
  grossWeight: number | null
  netWeight: number | null
  volume: number | null
  quantity: number
  status: string
  currentLocation: string | null
  deliveryStatus: string
}

interface ExpenseData {
  id: string
  expenseType: string
  vendor: { id: string; name: string } | null
  currency: string
  exchangeRate: number
  amount: number
  tax: number
  amountBase: number | null
  taxBase: number | null
  paymentStatus: string
  invoiceNumber: string | null
  notes: string | null
  expenseDate: string
}

interface RevenueData {
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

export function ShipmentDetail() {
  const { selectedShipmentId, goBack } = useNavigationStore()

  const [shipment, setShipment] = useState<ShipmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Container form
  const [showContainerForm, setShowContainerForm] = useState(false)
  const [containerForm, setContainerForm] = useState({
    containerNumber: '',
    containerType: '20DC',
    containerSize: '20',
    sealNumber: '',
    grossWeight: '',
    netWeight: '',
    volume: '1',
    status: 'empty',
    currentLocation: '',
    deliveryStatus: 'pending',
  })
  const [containerSubmitting, setContainerSubmitting] = useState(false)
  const [editingContainer, setEditingContainer] = useState<any>(null)

  // Expense form
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    expenseType: 'othc',
    vendorId: '',
    currency: 'USD',
    exchangeRate: '1',
    amount: '',
    tax: '0',
    paymentStatus: 'pending',
    invoiceNumber: '',
    notes: '',
  })
  const [expenseSubmitting, setExpenseSubmitting] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [vendors, setVendors] = useState<{ id: string; name: string; code: string }[]>([])

  // Revenue form
  const [showRevenueForm, setShowRevenueForm] = useState(false)
  const [revenueForm, setRevenueForm] = useState({
    customerId: '',
    revenueType: 'othc',
    invoiceNumber: '',
    currency: 'USD',
    exchangeRate: '1',
    amount: '',
    tax: '0',
    dueDate: '',
    paymentStatus: 'pending',
  })
  const [revenueSubmitting, setRevenueSubmitting] = useState(false)
  const [editingRevenue, setEditingRevenue] = useState<any>(null)
  const [customers, setCustomers] = useState<{ id: string; name: string; code: string }[]>([])
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false)
  const [currencies, setCurrencies] = useState<{ code: string; name: string; symbol: string }[]>([])
  const [containerPrices, setContainerPrices] = useState<Record<string, string>>({})
  const [baseCurrency, setBaseCurrency] = useState('USD')
  const [deletingItem, setDeletingItem] = useState<{ type: string; id: string } | null>(null)

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

  // Profit data
  const [profitData, setProfitData] = useState<{
    grossRevenue: number
    totalExpense: number
    netProfit: number
    profitMargin: number
    profitByContainer: { containerNumber: string; revenue: number; expense: number; profit: number }[]
    profitByCustomer: { customerName: string; revenue: number; expense: number; profit: number }[]
    profitByRoute: { route: string; revenue: number; expense: number; profit: number }[]
    expenseByType: Record<string, number>
  } | null>(null)

  const fetchShipment = useCallback(async (showLoader = true) => {
    if (!selectedShipmentId) return
    if (showLoader) setLoading(true)
    try {
      const res = await fetch(`/api/shipments/${selectedShipmentId}`)
      const json = await res.json()
      if (json.success) setShipment(json.data)
    } catch (err) {
      console.error('Failed to fetch shipment:', err)
    } finally {
      if (showLoader) setLoading(false)
    }
  }, [selectedShipmentId])

  const fetchProfit = useCallback(async () => {
    if (!selectedShipmentId) return
    try {
      const res = await fetch(`/api/shipments/${selectedShipmentId}/profit`)
      const json = await res.json()
      if (json.success) setProfitData(json.data)
    } catch (err) {
      console.error('Failed to fetch profit:', err)
    }
  }, [selectedShipmentId])

  useEffect(() => {
    fetchShipment()
    fetchProfit()
  }, [fetchShipment, fetchProfit])

  useEffect(() => {
    fetch('/api/vendors?limit=100')
      .then((r) => r.json())
      .then((json) => { if (json.success) setVendors(json.data || []) })
      .catch(() => {})
    fetch('/api/customers?limit=100')
      .then((r) => r.json())
      .then((json) => { if (json.success) setCustomers(json.data || []) })
      .catch(() => {})
    fetch('/api/currencies?isActive=true')
      .then((r) => r.json())
      .then((json) => { if (json.success) setCurrencies(json.data || []) })
      .catch(() => {})
  }, [])

  const handleDelete = async () => {
    if (!selectedShipmentId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/shipments/${selectedShipmentId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setDeleteDialog(false)
        goBack()
      }
    } catch (err) {
      console.error('Failed to delete shipment:', err)
    } finally {
      setDeleting(false)
    }
  }

  const handleAddContainer = async () => {
    if (!selectedShipmentId) return
    setContainerSubmitting(true)
    try {
      const quantity = Math.max(1, parseInt(containerForm.volume || '1') || 1)
      if (editingContainer) {
        const res = await fetch(`/api/shipments/${selectedShipmentId}/containers/${editingContainer.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            containerNumber: containerForm.containerNumber,
            containerType: containerForm.containerType,
            containerSize: containerForm.containerSize,
            sealNumber: containerForm.sealNumber || null,
            grossWeight: containerForm.grossWeight ? parseFloat(containerForm.grossWeight) : null,
            netWeight: containerForm.netWeight ? parseFloat(containerForm.netWeight) : null,
            quantity,
            status: containerForm.status,
            currentLocation: containerForm.currentLocation || null,
            deliveryStatus: containerForm.deliveryStatus,
          }),
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.error || 'Failed to update container')
      } else {
        const res = await fetch(`/api/shipments/${selectedShipmentId}/containers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...containerForm,
            containerNumber: containerForm.containerNumber || `CTNR-${Date.now()}`,
            grossWeight: containerForm.grossWeight ? parseFloat(containerForm.grossWeight) : null,
            netWeight: containerForm.netWeight ? parseFloat(containerForm.netWeight) : null,
            volume: null,
            quantity,
          }),
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.error || 'Failed to add container')
      }
      setShowContainerForm(false)
      setEditingContainer(null)
      setContainerForm({
        containerNumber: '', containerType: '20DC', containerSize: '20',
        sealNumber: '', grossWeight: '', netWeight: '', volume: '1',
        status: 'empty', currentLocation: '', deliveryStatus: 'pending',
      })
      fetchShipment(false)
    } catch (err) {
      console.error('Failed to add container:', err)
    } finally {
      setContainerSubmitting(false)
    }
  }

  const handleDeleteContainer = async (containerId: string) => {
    if (!selectedShipmentId) return
    try {
      const res = await fetch(`/api/shipments/${selectedShipmentId}/containers/${containerId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setDeletingItem(null)
        fetchShipment(false)
      }
    } catch (err) {
      console.error('Failed to delete container:', err)
    }
  }

  const handleAddExpense = async () => {
    if (!selectedShipmentId) return
    setExpenseSubmitting(true)
    try {
      const body = {
        ...expenseForm,
        vendorId: expenseForm.vendorId || null,
        exchangeRate: parseFloat(expenseForm.exchangeRate),
        amount: parseFloat(expenseForm.amount),
        tax: parseFloat(expenseForm.tax),
      }
      const res = await fetch(
        editingExpense
          ? `/api/shipments/${selectedShipmentId}/expenses/${editingExpense.id}`
          : `/api/shipments/${selectedShipmentId}/expenses`,
        {
          method: editingExpense ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )
      const json = await res.json()
      if (json.success) {
        setShowExpenseForm(false)
        setEditingExpense(null)
        setExpenseForm({
          expenseType: 'othc', vendorId: '', currency: 'USD',
          exchangeRate: '1', amount: '', tax: '0', paymentStatus: 'pending',
          invoiceNumber: '', notes: '',
        })
        fetchShipment(false)
        fetchProfit()
      }
    } catch (err) {
      console.error('Failed to add expense:', err)
    } finally {
      setExpenseSubmitting(false)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!selectedShipmentId) return
    try {
      const res = await fetch(`/api/shipments/${selectedShipmentId}/expenses/${expenseId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setDeletingItem(null)
        fetchShipment(false)
        fetchProfit()
      }
    } catch (err) {
      console.error('Failed to delete expense:', err)
    }
  }

  const toggleExpensePaymentStatus = async (expense: any) => {
    if (!selectedShipmentId) return
    const cycle: Record<string, string> = { pending: 'partial', partial: 'paid', paid: 'pending' }
    const nextStatus = cycle[expense.paymentStatus] || 'pending'
    try {
      await fetch(`/api/shipments/${selectedShipmentId}/expenses/${expense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: nextStatus }),
      })
      fetchShipment(false)
      fetchProfit()
    } catch (err) {
      console.error('Failed to update payment status:', err)
    }
  }

  const handleAddRevenue = async () => {
    if (!selectedShipmentId) return
    setRevenueSubmitting(true)
    try {
      const body = {
        ...revenueForm,
        customerId: revenueForm.customerId || null,
        exchangeRate: parseFloat(revenueForm.exchangeRate),
        amount: parseFloat(revenueForm.amount),
        tax: parseFloat(revenueForm.tax),
        dueDate: revenueForm.dueDate || null,
      }
      const res = await fetch(
        editingRevenue
          ? `/api/shipments/${selectedShipmentId}/revenues/${editingRevenue.id}`
          : `/api/shipments/${selectedShipmentId}/revenues`,
        {
          method: editingRevenue ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )
      const json = await res.json()
      if (json.success) {
        setShowRevenueForm(false)
        setEditingRevenue(null)
        setContainerPrices({})
        setRevenueForm({
          customerId: shipment?.customer?.id || '', revenueType: 'othc', invoiceNumber: '',
          currency: 'USD', exchangeRate: '1', amount: '', tax: '0',
          dueDate: '', paymentStatus: 'pending',
        })
        fetchShipment(false)
        fetchProfit()
      }
    } catch (err) {
      console.error('Failed to add revenue:', err)
    } finally {
      setRevenueSubmitting(false)
    }
  }

  const handleDeleteRevenue = async (revenueId: string) => {
    if (!selectedShipmentId) return
    try {
      const res = await fetch(`/api/shipments/${selectedShipmentId}/revenues/${revenueId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setDeletingItem(null)
        fetchShipment(false)
        fetchProfit()
      }
    } catch (err) {
      console.error('Failed to delete revenue:', err)
    }
  }

  const toggleRevenuePaymentStatus = async (revenue: any) => {
    if (!selectedShipmentId) return
    const cycle: Record<string, string> = { pending: 'partial', partial: 'paid', paid: 'overdue', overdue: 'pending' }
    const nextStatus = cycle[revenue.paymentStatus] || 'pending'
    try {
      await fetch(`/api/shipments/${selectedShipmentId}/revenues/${revenue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: nextStatus }),
      })
      fetchShipment(false)
      fetchProfit()
    } catch (err) {
      console.error('Failed to update payment status:', err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!shipment) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Package className="size-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold">Shipment not found</h3>
        <Button variant="outline" className="mt-4" onClick={goBack}>
          <ArrowLeft className="size-4 mr-2" />
          Back to Shipments
        </Button>
      </div>
    )
  }

  const totalExpenses = shipment.expenses.reduce(
    (sum, e) => sum + (e.amountBase || 0) + (e.taxBase || 0),
    0
  )
  const totalRevenues = shipment.revenues.reduce(
    (sum, r) => sum + (r.amountBase || 0) + (r.taxBase || 0),
    0
  )

  const expenseTypeLabels: Record<string, string> = {
    othc: 'OTHC', dthc: 'DTHC', x_ray: 'X-RAY', inspection: 'INSPECTION',
    d_and_d: 'D&D', storage: 'STORAGE', doc: 'DOC', pick_up: 'PICK UP',
  }

  const revenueTypeLabels: Record<string, string> = {
    othc: 'OTHC', dthc: 'DTHC', x_ray: 'X-RAY', inspection: 'INSPECTION',
    d_and_d: 'D&D', storage: 'STORAGE', doc: 'DOC', pick_up: 'PICK UP',
  }

  const statusTimeline = ['draft', 'booked', 'loading', 'in_transit', 'arrived', 'customs_clearance', 'delivered']
  const currentStatusIdx = statusTimeline.indexOf(shipment.status)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button variant="outline" size="sm" onClick={goBack}>
          <ArrowLeft className="size-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{shipment.shipmentNumber}</h1>
            <Badge variant="secondary" className={statusColors[shipment.status] || ''}>
              {statusLabels[shipment.status] || shipment.status}
            </Badge>
            <Badge variant="secondary" className={shipment.direction === 'import' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400'}>
              {shipment.direction === 'import' ? <ArrowDownLeft className="size-3 mr-1" /> : <ArrowUpRight className="size-3 mr-1" />}
              {shipment.direction === 'import' ? 'Import' : 'Export'}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {shipment.customer?.name || 'No customer'} &middot; {shipment.originCountry || '—'} → {shipment.destinationCountry || '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Pencil className="size-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteDialog(true)}>
            <Trash2 className="size-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="containers">
            Containers ({shipment.containers.length})
          </TabsTrigger>
          <TabsTrigger value="expenses">
            Expenses ({shipment.expenses.length})
          </TabsTrigger>
          <TabsTrigger value="revenues">
            Revenue ({shipment.revenues.length})
          </TabsTrigger>
          <TabsTrigger value="profit">Profit</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Status Timeline */}
          {shipment.status !== 'cancelled' && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between overflow-x-auto">
                  {statusTimeline.map((st, idx) => (
                    <div key={st} className="flex items-center">
                      <div className="flex flex-col items-center min-w-[80px]">
                        <div
                          className={`size-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx <= currentStatusIdx
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {idx <= currentStatusIdx ? '✓' : idx + 1}
                        </div>
                        <span className="text-[10px] mt-1 text-center text-muted-foreground whitespace-nowrap">
                          {statusLabels[st]}
                        </span>
                      </div>
                      {idx < statusTimeline.length - 1 && (
                        <div
                          className={`h-0.5 w-8 mx-1 ${
                            idx < currentStatusIdx
                              ? 'bg-emerald-500'
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2">
                    <Container className="size-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Containers</p>
                    <p className="text-xl font-bold">{shipment.containers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2">
                    <DollarSign className="size-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-xl font-bold">{formatCurrency(totalRevenues)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-2">
                    <DollarSign className="size-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expenses</p>
                    <p className="text-xl font-bold">{formatCurrency(totalExpenses)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${totalRevenues - totalExpenses >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                    <TrendingUp className={`size-5 ${totalRevenues - totalExpenses >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                    <p className={`text-xl font-bold ${totalRevenues - totalExpenses >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(totalRevenues - totalExpenses)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shipment Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Shipment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Shipment Number', value: shipment.shipmentNumber },
                  { label: 'Direction', value: shipment.direction === 'import' ? 'Import' : 'Export' },
                  { label: 'Transport Mode', value: shipment.transportMode.charAt(0).toUpperCase() + shipment.transportMode.slice(1) },
                  { label: 'Customer', value: shipment.customer?.name || '—' },
                  { label: 'Shipper', value: shipment.shipper || '—' },
                  { label: 'Consignee', value: shipment.consignee || '—' },
                  { label: 'Notify Party', value: shipment.notifyParty || '—' },
                  { label: 'Cargo Type', value: shipment.cargoType || '—' },
                  { label: 'IMO Class', value: shipment.imoClass || '—' },
                  { label: 'Status', value: statusLabels[shipment.status] || shipment.status },
                  { label: 'Free Days', value: shipment.freeDays ? String(shipment.freeDays) : '—' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium text-right">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Route & Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Origin Country', value: shipment.originCountry || '—' },
                    { label: 'Destination Country', value: shipment.destinationCountry || '—' },
                    { label: 'Port of Loading', value: shipment.portOfLoading || '—' },
                    { label: 'Port of Discharge', value: shipment.portOfDischarge || '—' },
                    { label: 'Final Destination', value: shipment.finalDestination || '—' },
                    { label: 'ETD', value: shipment.etd ? format(new Date(shipment.etd), 'MMM dd, yyyy') : '—' },
                    { label: 'ETA', value: shipment.eta ? format(new Date(shipment.eta), 'MMM dd, yyyy') : '—' },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium text-right">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Vessel & References</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Vessel Name', value: shipment.vesselName || '—' },
                    { label: 'Voyage Number', value: shipment.voyageNumber || '—' },
                    { label: 'Booking Number', value: shipment.bookingNumber || '—' },
                    { label: 'BL Number', value: shipment.blNumber || '—' },
                    { label: 'AWB Number', value: shipment.awbNumber || '—' },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium text-right">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {shipment.remarks && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Remarks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{shipment.remarks}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Containers Tab */}
        <TabsContent value="containers" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Containers</h3>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              size="sm"
              onClick={() => setShowContainerForm(true)}
            >
              <Plus className="size-4 mr-2" />
              Add Container
            </Button>
          </div>

          {shipment.containers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Container className="size-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No containers added yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setShowContainerForm(true)}
                >
                  <Plus className="size-4 mr-2" />
                  Add Container
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {([
                  { key: 'empty', label: 'Empty', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
                  { key: 'loaded', label: 'Loaded', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
                  { key: 'in_transit', label: 'In Transit', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400' },
                  { key: 'arrived', label: 'Arrived', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
                  { key: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
                ] as const).map(({ key, label, color }) => {
                  const count = shipment.containers.reduce((s, c) => s + (c.status === key ? (c.quantity || 1) : 0), 0)
                  if (count === 0) return null
                  return (
                    <div key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${color}`}>
                      {label}
                      <span className="font-bold">{count}</span>
                    </div>
                  )
                })}
              </div>
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(
                      shipment.containers.reduce<Record<string, typeof shipment.containers>>((acc, c) => {
                        ;(acc[c.containerType] ??= []).push(c)
                        return acc
                      }, {})
                    ).map(([type, containers]) => (
                    <Card key={type} className="border-emerald-200 dark:border-emerald-800">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg">{type}</h4>
                          <span className="text-2xl font-bold text-emerald-600">{containers.reduce((s, c) => s + (c.quantity || 1), 0)}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                          {([
                            { key: 'empty', label: 'Empty', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
                            { key: 'loaded', label: 'Loaded', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
                            { key: 'in_transit', label: 'In Transit', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400' },
                            { key: 'arrived', label: 'Arrived', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
                            { key: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
                          ] as const).map(({ key, label, color }) => {
                            const count = containers.reduce((s, c) => s + (c.status === key ? (c.quantity || 1) : 0), 0)
                            if (count === 0) return null
                            return (
                              <div key={key} className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${color}`}>
                                {label}
                                <span className="font-bold">{count}</span>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
              <Card className="mt-4">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Container #</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead>Seal #</TableHead>
                          <TableHead className="text-right">Gross Wt</TableHead>
                          <TableHead className="text-right">Net Wt</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Delivery</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shipment.containers.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.containerNumber}</TableCell>
                            <TableCell>{c.containerType}</TableCell>
                            <TableCell>{c.containerSize}&apos;</TableCell>
                            <TableCell className="text-right">{c.quantity || 1}</TableCell>
                            <TableCell>{c.sealNumber || '—'}</TableCell>
                            <TableCell className="text-right">{c.grossWeight ? `${c.grossWeight} kg` : '—'}</TableCell>
                            <TableCell className="text-right">{c.netWeight ? `${c.netWeight} kg` : '—'}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={containerStatusColors[c.status] || ''}>
                                {c.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[120px] truncate">{c.currentLocation || '—'}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={deliveryStatusColors[c.deliveryStatus] || ''}>
                                {c.deliveryStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  onClick={() => {
                                    setEditingContainer(c)
                                    setContainerForm({
                                      containerNumber: c.containerNumber,
                                      containerType: c.containerType,
                                      containerSize: c.containerSize,
                                      sealNumber: c.sealNumber || '',
                                      grossWeight: c.grossWeight?.toString() || '',
                                      netWeight: c.netWeight?.toString() || '',
                                      volume: c.quantity?.toString() || '1',
                                      status: c.status,
                                      currentLocation: c.currentLocation || '',
                                      deliveryStatus: c.deliveryStatus,
                                    })
                                    setShowContainerForm(true)
                                  }}
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-red-500 hover:text-red-600"
                                  onClick={() => setDeletingItem({ type: 'container', id: c.id })}
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
                </CardContent>
              </Card>
            </>
          )}

          {/* Container Dialog */}
          <Dialog open={showContainerForm} onOpenChange={(open) => {
            setShowContainerForm(open)
            if (!open) setEditingContainer(null)
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingContainer ? 'Edit Container' : 'Add Container'}</DialogTitle>
                <DialogDescription>{editingContainer ? 'Update this container.' : 'Add a new container to this shipment.'}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Container Number *</Label>
                  <Input
                    value={containerForm.containerNumber}
                    onChange={(e) => setContainerForm({ ...containerForm, containerNumber: e.target.value })}
                    placeholder="e.g. MSKU1234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={containerForm.containerType} onValueChange={(v) => setContainerForm({ ...containerForm, containerType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20DC">20DC</SelectItem>
                      <SelectItem value="40DC">40DC</SelectItem>
                      <SelectItem value="40HC">40HC</SelectItem>
                      <SelectItem value="Reefer">Reefer</SelectItem>
                      <SelectItem value="Open Top">Open Top</SelectItem>
                      <SelectItem value="Flat Rack">Flat Rack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Select value={containerForm.containerSize} onValueChange={(v) => setContainerForm({ ...containerForm, containerSize: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="40">40</SelectItem>
                      <SelectItem value="45">45</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Seal Number</Label>
                  <Input value={containerForm.sealNumber} onChange={(e) => setContainerForm({ ...containerForm, sealNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Gross Weight (kg)</Label>
                  <Input type="number" value={containerForm.grossWeight} onChange={(e) => setContainerForm({ ...containerForm, grossWeight: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Net Weight (kg)</Label>
                  <Input type="number" value={containerForm.netWeight} onChange={(e) => setContainerForm({ ...containerForm, netWeight: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" min="1" value={containerForm.volume} onChange={(e) => setContainerForm({ ...containerForm, volume: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={containerForm.status} onValueChange={(v) => setContainerForm({ ...containerForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empty">Empty</SelectItem>
                      <SelectItem value="loaded">Loaded</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="arrived">Arrived</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Current Location</Label>
                  <Input value={containerForm.currentLocation} onChange={(e) => setContainerForm({ ...containerForm, currentLocation: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Status</Label>
                  <Select value={containerForm.deliveryStatus} onValueChange={(v) => setContainerForm({ ...containerForm, deliveryStatus: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="picked_up">Picked Up</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowContainerForm(false)}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAddContainer} disabled={containerSubmitting}>
                  {containerSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                  {editingContainer ? 'Update Container' : 'Add Container'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Expenses</h3>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              size="sm"
              onClick={() => setShowExpenseForm(true)}
            >
              <Plus className="size-4 mr-2" />
              Add Expense
            </Button>
          </div>

          {shipment.expenses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <DollarSign className="size-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No expenses recorded yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowExpenseForm(true)}>
                  <Plus className="size-4 mr-2" />
                  Add Expense
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Expense Type</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Currency</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Tax</TableHead>
                          <TableHead className="text-right">Total (Base)</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Invoice #</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shipment.expenses.map((e) => (
                          <TableRow key={e.id}>
                            <TableCell className="font-medium">
                              {expenseTypeLabels[e.expenseType] || e.expenseType}
                            </TableCell>
                            <TableCell>{e.vendor?.name || '—'}</TableCell>
                            <TableCell>{e.currency}</TableCell>
                            <TableCell className="text-right">{formatCurrency(e.amount)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(e.tax)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency((e.amountBase || 0) + (e.taxBase || 0))}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`cursor-pointer ${paymentStatusColors[e.paymentStatus] || ''}`}
                                onClick={() => toggleExpensePaymentStatus(e)}
                              >
                                {e.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>{e.invoiceNumber || '—'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  onClick={() => {
                                    setEditingExpense(e)
                                    setExpenseForm({
                                      expenseType: e.expenseType,
                                      vendorId: e.vendor?.id || '',
                                      currency: e.currency,
                                      exchangeRate: e.exchangeRate.toString(),
                                      amount: e.amount.toString(),
                                      tax: e.tax.toString(),
                                      paymentStatus: e.paymentStatus,
                                      invoiceNumber: e.invoiceNumber || '',
                                      notes: e.notes || '',
                                    })
                                    setShowExpenseForm(true)
                                  }}
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-red-500 hover:text-red-600"
                                  onClick={() => setDeletingItem({ type: 'expense', id: e.id })}
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
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Card className="w-72">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Expenses (Base)</span>
                      <span className="font-bold">{formatCurrency(totalExpenses)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Expense Dialog */}
          <Dialog open={showExpenseForm} onOpenChange={(open) => {
            setShowExpenseForm(open)
            if (!open) setEditingExpense(null)
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
                <DialogDescription>{editingExpense ? 'Update this expense.' : 'Record a new expense for this shipment.'}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2 col-span-2">
                  <Label>Expense Type *</Label>
                  <ChargeTypeCombobox
                    type="expense"
                    value={expenseForm.expenseType}
                    onValueChange={(v) => setExpenseForm({ ...expenseForm, expenseType: v })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Select value={expenseForm.vendorId} onValueChange={(v) => setExpenseForm({ ...expenseForm, vendorId: v === '_none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">No Vendor</SelectItem>
                      {vendors.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={expenseForm.currency} onValueChange={(v) => setExpenseForm({ ...expenseForm, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Exchange Rate</Label>
                  <Input type="number" value={expenseForm.exchangeRate} onChange={(e) => setExpenseForm({ ...expenseForm, exchangeRate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tax</Label>
                  <Input type="number" value={expenseForm.tax} onChange={(e) => setExpenseForm({ ...expenseForm, tax: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select value={expenseForm.paymentStatus} onValueChange={(v) => setExpenseForm({ ...expenseForm, paymentStatus: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Invoice Number</Label>
                  <Input value={expenseForm.invoiceNumber} onChange={(e) => setExpenseForm({ ...expenseForm, invoiceNumber: e.target.value })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Notes</Label>
                  <Textarea value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowExpenseForm(false)}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAddExpense} disabled={expenseSubmitting}>
                  {expenseSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenues" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Revenue</h3>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              size="sm"
              onClick={() => {
                setRevenueForm((prev) => ({ ...prev, customerId: shipment?.customer?.id || '' }))
                setShowRevenueForm(true)
              }}
            >
              <Plus className="size-4 mr-2" />
              Add Revenue
            </Button>
          </div>

          {shipment.revenues.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="size-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No revenue recorded yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => {
                  setRevenueForm((prev) => ({ ...prev, customerId: shipment?.customer?.id || '' }))
                  setShowRevenueForm(true)
                }}>
                  <Plus className="size-4 mr-2" />
                  Add Revenue
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Revenue Type</TableHead>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Currency</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Tax</TableHead>
                          <TableHead className="text-right">Total (Base)</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shipment.revenues.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.customer?.name || '—'}</TableCell>
                            <TableCell>{revenueTypeLabels[r.revenueType] || r.revenueType}</TableCell>
                            <TableCell>{r.invoiceNumber || '—'}</TableCell>
                            <TableCell>{r.currency}</TableCell>
                            <TableCell className="text-right">{formatCurrency(r.amount)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(r.tax)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency((r.amountBase || 0) + (r.taxBase || 0))}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`cursor-pointer ${paymentStatusColors[r.paymentStatus] || ''}`}
                                onClick={() => toggleRevenuePaymentStatus(r)}
                              >
                                {r.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>{r.dueDate ? format(new Date(r.dueDate), 'MMM dd') : '—'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  onClick={() => {
                                    setEditingRevenue(r)
                                    setRevenueForm({
                                      customerId: r.customer?.id || '',
                                      revenueType: r.revenueType,
                                      invoiceNumber: r.invoiceNumber || '',
                                      currency: r.currency,
                                      exchangeRate: r.exchangeRate.toString(),
                                      amount: r.amount.toString(),
                                      tax: r.tax.toString(),
                                      dueDate: r.dueDate ? format(new Date(r.dueDate), 'yyyy-MM-dd') : '',
                                      paymentStatus: r.paymentStatus,
                                    })
                                    setShowRevenueForm(true)
                                  }}
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-red-500 hover:text-red-600"
                                  onClick={() => setDeletingItem({ type: 'revenue', id: r.id })}
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
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Card className="w-72">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Revenue (Base)</span>
                      <span className="font-bold">{formatCurrency(totalRevenues)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Revenue Dialog */}
          <Dialog open={showRevenueForm} onOpenChange={(open) => {
            setShowRevenueForm(open)
            if (!open) setEditingRevenue(null)
            if (open && !editingRevenue) {
              setRevenueForm((prev) => ({ ...prev, customerId: shipment?.customer?.id || '' }))
              const groups: Record<string, number> = {}
              for (const c of shipment?.containers || []) {
                const key = `${c.containerType}|${c.status}`
                groups[key] = (groups[key] || 0) + (c.quantity || 1)
              }
              const prices: Record<string, string> = {}
              for (const key of Object.keys(groups)) {
                prices[key] = ''
              }
              setContainerPrices(prices)
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingRevenue ? 'Edit Revenue' : 'Add Revenue'}</DialogTitle>
                <DialogDescription>{editingRevenue ? 'Update this revenue.' : 'Record a new revenue for this shipment.'}</DialogDescription>
              </DialogHeader>
              {showRevenueForm && shipment && shipment.containers.length > 0 && (
                <div className="border rounded-lg p-4 mb-4 space-y-3">
                  <h4 className="text-sm font-semibold">Container Pricing</h4>
                  {Object.entries(
                    shipment.containers.reduce((acc, c) => {
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
                        <Badge variant="secondary" className={`text-xs ${containerStatusColors[status] || ''}`}>
                          {status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">×{qty}</span>
                        <Input
                          type="number"
                          placeholder="Price"
                          value={containerPrices[key] || ''}
                          onChange={(e) => {
                            const v = e.target.value
                            const newPrices = { ...containerPrices, [key]: v }
                            setContainerPrices(newPrices)
                            const groups = shipment.containers.reduce((acc, c) => {
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
                          const qty = shipment.containers.reduce((s, c) => s + (`${c.containerType}|${c.status}` === key ? (c.quantity || 1) : 0), 0)
                          return sum + qty * (parseFloat(price || '0') || 0)
                        }, 0)
                      )}
                    </span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Customer</Label>
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
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  !revenueForm.customerId ? 'opacity-100' : 'opacity-0'
                                )}
                              />
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
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    revenueForm.customerId === c.id ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                {c.name} ({c.code})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Revenue Type *</Label>
                  <ChargeTypeCombobox
                    type="revenue"
                    value={revenueForm.revenueType}
                    onValueChange={(v) => setRevenueForm({ ...revenueForm, revenueType: v })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Invoice Number</Label>
                  <Input value={revenueForm.invoiceNumber} onChange={(e) => setRevenueForm({ ...revenueForm, invoiceNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={revenueForm.currency} onValueChange={(v) => setRevenueForm({ ...revenueForm, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Exchange Rate</Label>
                  <Input type="number" value={revenueForm.exchangeRate} onChange={(e) => setRevenueForm({ ...revenueForm, exchangeRate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input type="number" readOnly value={revenueForm.amount} className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Tax</Label>
                  <Input type="number" value={revenueForm.tax} onChange={(e) => setRevenueForm({ ...revenueForm, tax: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={revenueForm.dueDate} onChange={(e) => setRevenueForm({ ...revenueForm, dueDate: e.target.value })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Payment Status</Label>
                  <Select value={revenueForm.paymentStatus} onValueChange={(v) => setRevenueForm({ ...revenueForm, paymentStatus: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRevenueForm(false)}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAddRevenue} disabled={revenueSubmitting}>
                  {revenueSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                  {editingRevenue ? 'Update Revenue' : 'Add Revenue'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Profit Tab */}
        <TabsContent value="profit" className="space-y-4">
          {profitData ? (
            <>
              {/* Profit Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Gross Revenue</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(profitData.grossRevenue)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(profitData.totalExpense)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                    <p className={`text-2xl font-bold ${profitData.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(profitData.netProfit)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Profit Margin</p>
                    <p className={`text-2xl font-bold ${profitData.profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {profitData.profitMargin.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {profitData.profitByContainer.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Profit by Container</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={profitData.profitByContainer}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="containerNumber" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Bar dataKey="revenue" name="Revenue" fill="#10b981" />
                          <Bar dataKey="expense" name="Expense" fill="#ef4444" />
                          <Bar dataKey="profit" name="Profit" fill="#14b8a6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {profitData.profitByCustomer.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Revenue by Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={profitData.profitByCustomer}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="customerName" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Bar dataKey="revenue" name="Revenue" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {Object.keys(profitData.expenseByType).length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Expense Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={Object.entries(profitData.expenseByType).map(([name, value]) => ({
                              name: expenseTypeLabels[name] || name,
                              value,
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {Object.entries(profitData.expenseByType).map((_, idx) => (
                              <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {profitData.profitByRoute.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Route Profitability</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={profitData.profitByRoute}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="route" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Bar dataKey="revenue" name="Revenue" fill="#10b981" />
                          <Bar dataKey="expense" name="Expense" fill="#ef4444" />
                          <Bar dataKey="profit" name="Profit" fill="#14b8a6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="size-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No profit data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Shipment Form */}
      <ShipmentForm
        open={showForm}
        onOpenChange={setShowForm}
        shipment={shipment}
        onSuccess={fetchShipment}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shipment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{shipment.shipmentNumber}</strong>? This will remove all containers, expenses, and revenues.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Confirmation */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => { if (!open) setDeletingItem(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingItem?.type}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deletingItem?.type}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (!deletingItem) return
                if (deletingItem.type === 'container') handleDeleteContainer(deletingItem.id)
                else if (deletingItem.type === 'expense') handleDeleteExpense(deletingItem.id)
                else if (deletingItem.type === 'revenue') handleDeleteRevenue(deletingItem.id)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
