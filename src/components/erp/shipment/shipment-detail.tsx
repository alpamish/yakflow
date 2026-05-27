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
} from 'lucide-react'
import { format } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

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
    volume: '',
    status: 'empty',
    currentLocation: '',
    deliveryStatus: 'pending',
  })
  const [containerSubmitting, setContainerSubmitting] = useState(false)

  // Expense form
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    expenseType: 'ocean_freight',
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
  const [vendors, setVendors] = useState<{ id: string; name: string; code: string }[]>([])

  // Revenue form
  const [showRevenueForm, setShowRevenueForm] = useState(false)
  const [revenueForm, setRevenueForm] = useState({
    customerId: '',
    revenueType: 'freight_charges',
    invoiceNumber: '',
    currency: 'USD',
    exchangeRate: '1',
    amount: '',
    tax: '0',
    dueDate: '',
    paymentStatus: 'pending',
  })
  const [revenueSubmitting, setRevenueSubmitting] = useState(false)
  const [customers, setCustomers] = useState<{ id: string; name: string; code: string }[]>([])

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

  const fetchShipment = useCallback(async () => {
    if (!selectedShipmentId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/shipments/${selectedShipmentId}`)
      const json = await res.json()
      if (json.success) setShipment(json.data)
    } catch (err) {
      console.error('Failed to fetch shipment:', err)
    } finally {
      setLoading(false)
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
      const res = await fetch(`/api/shipments/${selectedShipmentId}/containers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...containerForm,
          grossWeight: containerForm.grossWeight ? parseFloat(containerForm.grossWeight) : null,
          netWeight: containerForm.netWeight ? parseFloat(containerForm.netWeight) : null,
          volume: containerForm.volume ? parseFloat(containerForm.volume) : null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setShowContainerForm(false)
        setContainerForm({
          containerNumber: '', containerType: '20DC', containerSize: '20',
          sealNumber: '', grossWeight: '', netWeight: '', volume: '',
          status: 'empty', currentLocation: '', deliveryStatus: 'pending',
        })
        fetchShipment()
      }
    } catch (err) {
      console.error('Failed to add container:', err)
    } finally {
      setContainerSubmitting(false)
    }
  }

  const handleAddExpense = async () => {
    if (!selectedShipmentId) return
    setExpenseSubmitting(true)
    try {
      const res = await fetch(`/api/shipments/${selectedShipmentId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expenseForm,
          vendorId: expenseForm.vendorId || null,
          exchangeRate: parseFloat(expenseForm.exchangeRate),
          amount: parseFloat(expenseForm.amount),
          tax: parseFloat(expenseForm.tax),
        }),
      })
      const json = await res.json()
      if (json.success) {
        setShowExpenseForm(false)
        setExpenseForm({
          expenseType: 'ocean_freight', vendorId: '', currency: 'USD',
          exchangeRate: '1', amount: '', tax: '0', paymentStatus: 'pending',
          invoiceNumber: '', notes: '',
        })
        fetchShipment()
        fetchProfit()
      }
    } catch (err) {
      console.error('Failed to add expense:', err)
    } finally {
      setExpenseSubmitting(false)
    }
  }

  const handleAddRevenue = async () => {
    if (!selectedShipmentId) return
    setRevenueSubmitting(true)
    try {
      const res = await fetch(`/api/shipments/${selectedShipmentId}/revenues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...revenueForm,
          customerId: revenueForm.customerId || null,
          exchangeRate: parseFloat(revenueForm.exchangeRate),
          amount: parseFloat(revenueForm.amount),
          tax: parseFloat(revenueForm.tax),
          dueDate: revenueForm.dueDate || null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setShowRevenueForm(false)
        setRevenueForm({
          customerId: '', revenueType: 'freight_charges', invoiceNumber: '',
          currency: 'USD', exchangeRate: '1', amount: '', tax: '0',
          dueDate: '', paymentStatus: 'pending',
        })
        fetchShipment()
        fetchProfit()
      }
    } catch (err) {
      console.error('Failed to add revenue:', err)
    } finally {
      setRevenueSubmitting(false)
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
    ocean_freight: 'Ocean Freight', dthc: 'DTHC', othc: 'OTHC', railways: 'Railways',
    x_ray: 'X-Ray', inspection: 'Inspection', customs: 'Customs', fuel: 'Fuel',
    toll: 'Toll', driver_expense: 'Driver Expense', port_charges: 'Port Charges',
    handling_charges: 'Handling Charges', warehouse_charges: 'Warehouse Charges',
    documentation: 'Documentation', agency_charges: 'Agency Charges', miscellaneous: 'Miscellaneous',
  }

  const revenueTypeLabels: Record<string, string> = {
    freight_charges: 'Freight Charges', delivery_charges: 'Delivery Charges',
    customs_charges: 'Customs Charges', documentation_fees: 'Documentation Fees',
    handling_fees: 'Handling Fees', storage_charges: 'Storage Charges', other_charges: 'Other Charges',
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
                    <p className="text-xl font-bold">{currencyFormatter.format(totalRevenues)}</p>
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
                    <p className="text-xl font-bold">{currencyFormatter.format(totalExpenses)}</p>
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
                      {currencyFormatter.format(totalRevenues - totalExpenses)}
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
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Container #</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Seal #</TableHead>
                        <TableHead className="text-right">Gross Wt</TableHead>
                        <TableHead className="text-right">Net Wt</TableHead>
                        <TableHead className="text-right">Volume</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Delivery</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shipment.containers.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.containerNumber}</TableCell>
                          <TableCell>{c.containerType}</TableCell>
                          <TableCell>{c.containerSize}&apos;</TableCell>
                          <TableCell>{c.sealNumber || '—'}</TableCell>
                          <TableCell className="text-right">{c.grossWeight ? `${c.grossWeight} kg` : '—'}</TableCell>
                          <TableCell className="text-right">{c.netWeight ? `${c.netWeight} kg` : '—'}</TableCell>
                          <TableCell className="text-right">{c.volume ? `${c.volume} m³` : '—'}</TableCell>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Container Dialog */}
          <Dialog open={showContainerForm} onOpenChange={setShowContainerForm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Container</DialogTitle>
                <DialogDescription>Add a new container to this shipment.</DialogDescription>
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
                  <Label>Volume (m³)</Label>
                  <Input type="number" value={containerForm.volume} onChange={(e) => setContainerForm({ ...containerForm, volume: e.target.value })} />
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
                  Add Container
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
                            <TableCell className="text-right">{currencyFormatter.format(e.amount)}</TableCell>
                            <TableCell className="text-right">{currencyFormatter.format(e.tax)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {currencyFormatter.format((e.amountBase || 0) + (e.taxBase || 0))}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={paymentStatusColors[e.paymentStatus] || ''}>
                                {e.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>{e.invoiceNumber || '—'}</TableCell>
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
                      <span className="font-bold">{currencyFormatter.format(totalExpenses)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Expense Dialog */}
          <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
                <DialogDescription>Record a new expense for this shipment.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2 col-span-2">
                  <Label>Expense Type *</Label>
                  <Select value={expenseForm.expenseType} onValueChange={(v) => setExpenseForm({ ...expenseForm, expenseType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(expenseTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CNY">CNY</SelectItem>
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
                  Add Expense
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
              onClick={() => setShowRevenueForm(true)}
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
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowRevenueForm(true)}>
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shipment.revenues.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.customer?.name || '—'}</TableCell>
                            <TableCell>{revenueTypeLabels[r.revenueType] || r.revenueType}</TableCell>
                            <TableCell>{r.invoiceNumber || '—'}</TableCell>
                            <TableCell>{r.currency}</TableCell>
                            <TableCell className="text-right">{currencyFormatter.format(r.amount)}</TableCell>
                            <TableCell className="text-right">{currencyFormatter.format(r.tax)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {currencyFormatter.format((r.amountBase || 0) + (r.taxBase || 0))}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={paymentStatusColors[r.paymentStatus] || ''}>
                                {r.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>{r.dueDate ? format(new Date(r.dueDate), 'MMM dd') : '—'}</TableCell>
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
                      <span className="font-bold">{currencyFormatter.format(totalRevenues)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Revenue Dialog */}
          <Dialog open={showRevenueForm} onOpenChange={setShowRevenueForm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Revenue</DialogTitle>
                <DialogDescription>Record a new revenue for this shipment.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select value={revenueForm.customerId} onValueChange={(v) => setRevenueForm({ ...revenueForm, customerId: v === '_none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">No Customer</SelectItem>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Revenue Type *</Label>
                  <Select value={revenueForm.revenueType} onValueChange={(v) => setRevenueForm({ ...revenueForm, revenueType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(revenueTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CNY">CNY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Exchange Rate</Label>
                  <Input type="number" value={revenueForm.exchangeRate} onChange={(e) => setRevenueForm({ ...revenueForm, exchangeRate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input type="number" value={revenueForm.amount} onChange={(e) => setRevenueForm({ ...revenueForm, amount: e.target.value })} />
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
                  Add Revenue
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
                    <p className="text-2xl font-bold text-emerald-600">{currencyFormatter.format(profitData.grossRevenue)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">{currencyFormatter.format(profitData.totalExpense)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                    <p className={`text-2xl font-bold ${profitData.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {currencyFormatter.format(profitData.netProfit)}
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
                          <Tooltip formatter={(value: number) => currencyFormatter.format(value)} />
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
                          <Tooltip formatter={(value: number) => currencyFormatter.format(value)} />
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
                          <Tooltip formatter={(value: number) => currencyFormatter.format(value)} />
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
                          <Tooltip formatter={(value: number) => currencyFormatter.format(value)} />
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
    </div>
  )
}
