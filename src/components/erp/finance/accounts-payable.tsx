'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  ArrowDownLeft,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Eye,
  FileText,
  TrendingDown,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Payment {
  id: string
  amount: number
  currency: string
  paymentDate: string
  paymentMethod: string | null
}

interface Invoice {
  id: string
  invoiceNumber: string
  type: string
  entityType: string
  entityId: string | null
  customerId: string | null
  vendorId: string | null
  currency: string
  exchangeRate: number
  subtotal: number
  taxAmount: number
  totalAmount: number
  totalBase: number | null
  dueDate: string | null
  status: string
  notes: string | null
  createdAt: string
  payments: Payment[]
}

interface Vendor {
  id: string
  name: string
  code: string
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  sent: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
  partial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  partial: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function AccountsPayable() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [vendorFilter, setVendorFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formVendor, setFormVendor] = useState('')
  const [formCurrency, setFormCurrency] = useState('USD')
  const [formSubtotal, setFormSubtotal] = useState('')
  const [formTax, setFormTax] = useState('0')
  const [formDueDate, setFormDueDate] = useState('')
  const [formNotes, setFormNotes] = useState('')

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        type: 'payable',
      })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const res = await fetch(`/api/invoices?${params}`)
      const json = await res.json()
      if (json.success) {
        setInvoices(json.data || [])
        setTotalPages(json.pagination?.totalPages || 1)
        setTotal(json.pagination?.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, startDate, endDate])

  const fetchVendors = useCallback(async () => {
    try {
      const res = await fetch('/api/vendors?limit=100')
      const json = await res.json()
      if (json.success) {
        setVendors(json.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err)
    }
  }, [])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  // Summary calculations
  const totalPayable = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const pendingAmount = invoices
    .filter((inv) => inv.status === 'sent' || inv.status === 'draft')
    .reduce((sum, inv) => sum + inv.totalAmount, 0)
  const overdueAmount = invoices
    .filter((inv) => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.totalAmount, 0)
  const paidThisMonth = invoices
    .filter((inv) => {
      if (inv.status !== 'paid') return false
      const hasPaymentThisMonth = inv.payments.some((p) => {
        const d = new Date(p.paymentDate)
        const now = new Date()
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      return hasPaymentThisMonth
    })
    .reduce((sum, inv) => {
      const monthPayments = inv.payments.filter((p) => {
        const d = new Date(p.paymentDate)
        const now = new Date()
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      return sum + monthPayments.reduce((s, p) => s + p.amount, 0)
    }, 0)

  // Aging calculations
  const now = new Date()
  const agingBuckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }
  invoices.forEach((inv) => {
    if (inv.status === 'paid' || inv.status === 'cancelled') return
    const paidAmount = inv.payments.reduce((s, p) => s + p.amount, 0)
    const outstanding = inv.totalAmount - paidAmount
    if (outstanding <= 0) return
    if (!inv.dueDate) return
    const daysPastDue = differenceInDays(now, new Date(inv.dueDate))
    if (daysPastDue <= 30) agingBuckets['0-30'] += outstanding
    else if (daysPastDue <= 60) agingBuckets['31-60'] += outstanding
    else if (daysPastDue <= 90) agingBuckets['61-90'] += outstanding
    else agingBuckets['90+'] += outstanding
  })

  const handleCreate = async () => {
    setCreating(true)
    try {
      const sub = parseFloat(formSubtotal) || 0
      const tax = parseFloat(formTax) || 0
      const totalAmt = sub + tax
      const invoiceNumber = `AP-${format(now, 'yyyy')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber,
          type: 'payable',
          entityType: 'shipment',
          vendorId: formVendor || null,
          currency: formCurrency,
          subtotal: sub,
          taxAmount: tax,
          totalAmount: totalAmt,
          dueDate: formDueDate || null,
          notes: formNotes || null,
          status: 'draft',
        }),
      })
      const json = await res.json()
      if (json.success) {
        setShowCreateDialog(false)
        resetForm()
        fetchInvoices()
      }
    } catch (err) {
      console.error('Failed to create invoice:', err)
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    setFormVendor('')
    setFormCurrency('USD')
    setFormSubtotal('')
    setFormTax('0')
    setFormDueDate('')
    setFormNotes('')
  }

  const subtotal = parseFloat(formSubtotal) || 0
  const tax = parseFloat(formTax) || 0
  const calculatedTotal = subtotal + tax

  // Filtered invoices by vendor (client-side)
  const filteredInvoices = vendorFilter
    ? invoices.filter((inv) => inv.vendorId === vendorFilter)
    : invoices

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ArrowDownLeft className="size-6 text-teal-600" />
            Accounts Payable
          </h1>
          <p className="text-muted-foreground text-sm">
            Track and manage outgoing payments to vendors
          </p>
        </div>
        <Button
          className="bg-teal-600 hover:bg-teal-700 text-white"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="size-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Payable</p>
                <p className="text-2xl font-bold text-teal-600">
                  {currencyFormatter.format(totalPayable)}
                </p>
              </div>
              <div className="size-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                <DollarSign className="size-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-600">
                  {currencyFormatter.format(pendingAmount)}
                </p>
              </div>
              <div className="size-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="size-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {currencyFormatter.format(overdueAmount)}
                </p>
              </div>
              <div className="size-10 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="size-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid This Month</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {currencyFormatter.format(paidThisMonth)}
                </p>
              </div>
              <div className="size-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="size-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v === 'all' ? '' : v)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={vendorFilter}
              onValueChange={(v) => {
                setVendorFilter(v === 'all' ? '' : v)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start date"
            />
            <div className="flex gap-2">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End date"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('')
                  setVendorFilter('')
                  setStartDate('')
                  setEndDate('')
                  setPage(1)
                }}
              >
                <Filter className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Payable Invoices
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({total} total)
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="size-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No payable invoices found</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                {search || statusFilter || vendorFilter
                  ? 'Try adjusting your filters'
                  : 'Create your first payable invoice to get started'}
              </p>
              {!search && !statusFilter && !vendorFilter && (
                <Button
                  className="mt-4 bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="size-4 mr-2" />
                  Create Invoice
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[calc(100vh-500px)] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((inv) => {
                      const vendor = vendors.find((v) => v.id === inv.vendorId)
                      return (
                        <TableRow key={inv.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-teal-600 dark:text-teal-400 whitespace-nowrap">
                            {inv.invoiceNumber}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {vendor?.name || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {inv.currency}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            {currencyFormatter.format(inv.subtotal)}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            {currencyFormatter.format(inv.taxAmount)}
                          </TableCell>
                          <TableCell className="text-right font-semibold whitespace-nowrap">
                            {currencyFormatter.format(inv.totalAmount)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {inv.dueDate ? format(new Date(inv.dueDate), 'MMM dd, yyyy') : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={statusColors[inv.status] || ''}
                            >
                              {statusLabels[inv.status] || inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Aging Report */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingDown className="size-4 text-teal-600" />
            Aging Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '0-30 Days', amount: agingBuckets['0-30'], color: 'teal' },
              { label: '31-60 Days', amount: agingBuckets['31-60'], color: 'amber' },
              { label: '61-90 Days', amount: agingBuckets['61-90'], color: 'orange' },
              { label: '90+ Days', amount: agingBuckets['90+'], color: 'red' },
            ].map((bucket) => (
              <div
                key={bucket.label}
                className={`p-4 rounded-lg border ${
                  bucket.color === 'teal'
                    ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800'
                    : bucket.color === 'amber'
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                      : bucket.color === 'orange'
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <p className="text-sm text-muted-foreground">{bucket.label}</p>
                <p
                  className={`text-xl font-bold ${
                    bucket.color === 'teal'
                      ? 'text-teal-700 dark:text-teal-400'
                      : bucket.color === 'amber'
                        ? 'text-amber-700 dark:text-amber-400'
                        : bucket.color === 'orange'
                          ? 'text-orange-700 dark:text-orange-400'
                          : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  {currencyFormatter.format(bucket.amount)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Payable Invoice</DialogTitle>
            <DialogDescription>
              Add a new invoice for money owed to vendors
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 pr-4">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select value={formVendor} onValueChange={setFormVendor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} ({v.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={formCurrency} onValueChange={setFormCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CNY">CNY</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subtotal</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formSubtotal}
                    onChange={(e) => setFormSubtotal(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tax Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formTax}
                    onChange={(e) => setFormTax(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                <span className="font-semibold">Total Amount</span>
                <span className="text-xl font-bold text-teal-600">
                  {currencyFormatter.format(calculatedTotal)}
                </span>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={handleCreate}
              disabled={creating || !formSubtotal}
            >
              {creating ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
