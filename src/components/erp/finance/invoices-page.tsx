'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  DollarSign,
} from 'lucide-react'
import { format } from 'date-fns'

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Payment {
  id: string
  amount: number
  currency: string
  exchangeRate: number
  paymentMethod: string | null
  reference: string | null
  paymentDate: string
  notes: string | null
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

interface Customer {
  id: string
  name: string
  code: string
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

const paymentMethodLabels: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
  check: 'Check',
  card: 'Card',
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filters
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Detail dialog
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formType, setFormType] = useState('receivable')
  const [formEntityId, setFormEntityId] = useState('')
  const [formCustomerId, setFormCustomerId] = useState('')
  const [formVendorId, setFormVendorId] = useState('')
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
      })
      if (tab !== 'all') params.set('type', tab)
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
  }, [page, tab, search, statusFilter, startDate, endDate])

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers?limit=100')
      const json = await res.json()
      if (json.success) setCustomers(json.data || [])
    } catch (err) {
      console.error('Failed to fetch customers:', err)
    }
  }, [])

  const fetchVendors = useCallback(async () => {
    try {
      const res = await fetch('/api/vendors?limit=100')
      const json = await res.json()
      if (json.success) setVendors(json.data || [])
    } catch (err) {
      console.error('Failed to fetch vendors:', err)
    }
  }, [])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  useEffect(() => {
    fetchCustomers()
    fetchVendors()
  }, [fetchCustomers, fetchVendors])

  // Summary stats
  const receivableTotal = invoices
    .filter((inv) => inv.type === 'receivable')
    .reduce((sum, inv) => sum + inv.totalAmount, 0)
  const payableTotal = invoices
    .filter((inv) => inv.type === 'payable')
    .reduce((sum, inv) => sum + inv.totalAmount, 0)
  const overdueCount = invoices.filter((inv) => inv.status === 'overdue').length
  const paidCount = invoices.filter((inv) => inv.status === 'paid').length

  const handleCreate = async () => {
    setCreating(true)
    try {
      const sub = parseFloat(formSubtotal) || 0
      const tax = parseFloat(formTax) || 0
      const totalAmt = sub + tax
      const prefix = formType === 'receivable' ? 'AR' : 'AP'
      const invoiceNumber = `${prefix}-${format(new Date(), 'yyyy')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber,
          type: formType,
          entityType: 'shipment',
          entityId: formEntityId || null,
          customerId: formType === 'receivable' ? formCustomerId || null : null,
          vendorId: formType === 'payable' ? formVendorId || null : null,
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
    setFormType('receivable')
    setFormEntityId('')
    setFormCustomerId('')
    setFormVendorId('')
    setFormCurrency('USD')
    setFormSubtotal('')
    setFormTax('0')
    setFormDueDate('')
    setFormNotes('')
  }

  const subtotal = parseFloat(formSubtotal) || 0
  const tax = parseFloat(formTax) || 0
  const calculatedTotal = subtotal + tax

  const getCustomerName = (id: string | null) => {
    if (!id) return '—'
    return customers.find((c) => c.id === id)?.name || '—'
  }

  const getVendorName = (id: string | null) => {
    if (!id) return '—'
    return vendors.find((v) => v.id === id)?.name || '—'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="size-6 text-emerald-600" />
            Invoices
          </h1>
          <p className="text-muted-foreground text-sm">
            Unified invoice management for receivables and payables
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="size-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receivable</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {currencyFormatter.format(receivableTotal)}
                </p>
              </div>
              <div className="size-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <ArrowUpRight className="size-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payable</p>
                <p className="text-2xl font-bold text-teal-600">
                  {currencyFormatter.format(payableTotal)}
                </p>
              </div>
              <div className="size-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                <ArrowDownLeft className="size-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
              <div className="size-10 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                <DollarSign className="size-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-green-600">{paidCount}</p>
              </div>
              <div className="size-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                <Receipt className="size-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Filters */}
      <Card>
        <CardContent className="p-4">
          <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1) }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="receivable">Receivable</TabsTrigger>
                <TabsTrigger value="payable">Payable</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v === 'all' ? '' : v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-40">
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
                <div className="hidden lg:flex items-center gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-36"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-36"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('')
                    setStartDate('')
                    setEndDate('')
                    setPage(1)
                  }}
                >
                  <Filter className="size-4" />
                </Button>
              </div>
            </div>

            <TabsContent value={tab} className="mt-0">
              {/* Table */}
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="size-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold">No invoices found</h3>
                  <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                    {search || statusFilter
                      ? 'Try adjusting your filters'
                      : 'Create your first invoice to get started'}
                  </p>
                  {!search && !statusFilter && (
                    <Button
                      className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setShowCreateDialog(true)}
                    >
                      <Plus className="size-4 mr-2" />
                      Create Invoice
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto max-h-[calc(100vh-440px)] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Customer/Vendor</TableHead>
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
                        {invoices.map((inv) => (
                          <TableRow key={inv.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              {inv.invoiceNumber}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  inv.type === 'receivable'
                                    ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400'
                                    : 'border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-400'
                                }
                              >
                                {inv.type === 'receivable' ? (
                                  <ArrowUpRight className="size-3 mr-1" />
                                ) : (
                                  <ArrowDownLeft className="size-3 mr-1" />
                                )}
                                {inv.type === 'receivable' ? 'AR' : 'AP'}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate">
                              {inv.type === 'receivable'
                                ? getCustomerName(inv.customerId)
                                : getVendorName(inv.vendorId)}
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
                              {inv.dueDate
                                ? format(new Date(inv.dueDate), 'MMM dd, yyyy')
                                : '—'}
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setSelectedInvoice(inv)}
                              >
                                <Eye className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {page} of {totalPages} ({total} invoices)
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-2xl">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="size-5 text-emerald-600" />
                  {selectedInvoice.invoiceNumber}
                </DialogTitle>
                <DialogDescription>
                  Invoice details and payment history
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-6 pr-4">
                  {/* Invoice Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <Badge
                        variant="outline"
                        className={
                          selectedInvoice.type === 'receivable'
                            ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400'
                            : 'border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-400'
                        }
                      >
                        {selectedInvoice.type === 'receivable' ? 'Receivable' : 'Payable'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        variant="secondary"
                        className={statusColors[selectedInvoice.status] || ''}
                      >
                        {statusLabels[selectedInvoice.status] || selectedInvoice.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {selectedInvoice.type === 'receivable' ? 'Customer' : 'Vendor'}
                      </p>
                      <p className="font-medium">
                        {selectedInvoice.type === 'receivable'
                          ? getCustomerName(selectedInvoice.customerId)
                          : getVendorName(selectedInvoice.vendorId)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Currency</p>
                      <p className="font-medium">{selectedInvoice.currency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-medium">
                        {selectedInvoice.dueDate
                          ? format(new Date(selectedInvoice.dueDate), 'MMM dd, yyyy')
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {format(new Date(selectedInvoice.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Amount Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{currencyFormatter.format(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>{currencyFormatter.format(selectedInvoice.taxAmount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-emerald-600">
                        {currencyFormatter.format(selectedInvoice.totalAmount)}
                      </span>
                    </div>
                    {selectedInvoice.payments.length > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Paid</span>
                          <span className="text-green-600">
                            {currencyFormatter.format(
                              selectedInvoice.payments.reduce((s, p) => s + p.amount, 0)
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Outstanding</span>
                          <span className="text-amber-600">
                            {currencyFormatter.format(
                              selectedInvoice.totalAmount -
                                selectedInvoice.payments.reduce((s, p) => s + p.amount, 0)
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {selectedInvoice.notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm">{selectedInvoice.notes}</p>
                      </div>
                    </>
                  )}

                  {/* Payment History */}
                  {selectedInvoice.payments.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-3">Payment History</h4>
                        <div className="space-y-2">
                          {selectedInvoice.payments.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            >
                              <div className="space-y-1">
                                <p className="text-sm font-medium">
                                  {currencyFormatter.format(p.amount)} {p.currency}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {p.paymentMethod
                                    ? paymentMethodLabels[p.paymentMethod] || p.paymentMethod
                                    : 'No method'}
                                  {p.reference ? ` • Ref: ${p.reference}` : ''}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(p.paymentDate), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>Add a new receivable or payable invoice</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 pr-4">
              <div className="space-y-2">
                <Label>Invoice Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receivable">
                      <span className="flex items-center gap-2">
                        <ArrowUpRight className="size-3" /> Receivable
                      </span>
                    </SelectItem>
                    <SelectItem value="payable">
                      <span className="flex items-center gap-2">
                        <ArrowDownLeft className="size-3" /> Payable
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formType === 'receivable' ? (
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select value={formCustomerId} onValueChange={setFormCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Select value={formVendorId} onValueChange={setFormVendorId}>
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
              )}

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

              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <span className="font-semibold">Total Amount</span>
                <span className="text-xl font-bold text-emerald-600">
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
