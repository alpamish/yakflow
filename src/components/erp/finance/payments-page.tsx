'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Banknote,
  Calendar,
  Wallet,
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
import { ScrollArea } from '@/components/ui/scroll-area'

interface InvoiceSummary {
  id: string
  invoiceNumber: string
  type: string
  status: string
}

interface Payment {
  id: string
  invoiceId: string
  amount: number
  currency: string
  exchangeRate: number
  amountBase: number | null
  paymentMethod: string | null
  reference: string | null
  paymentDate: string
  notes: string | null
  createdAt: string
  invoice: InvoiceSummary
}

const paymentMethodLabels: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
  check: 'Check',
  card: 'Card',
}

const paymentMethodColors: Record<string, string> = {
  bank_transfer: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
  cash: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  check: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  card: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filters
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formInvoiceId, setFormInvoiceId] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formCurrency, setFormCurrency] = useState('USD')
  const [formExchangeRate, setFormExchangeRate] = useState('1')
  const [formPaymentMethod, setFormPaymentMethod] = useState('bank_transfer')
  const [formReference, setFormReference] = useState('')
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [formNotes, setFormNotes] = useState('')

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      })
      if (paymentMethodFilter) params.set('paymentMethod', paymentMethodFilter)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const res = await fetch(`/api/payments?${params}`)
      const json = await res.json()
      if (json.success) {
        setPayments(json.data || [])
        setTotalPages(json.pagination?.totalPages || 1)
        setTotal(json.pagination?.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err)
    } finally {
      setLoading(false)
    }
  }, [page, paymentMethodFilter, startDate, endDate])

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch('/api/invoices?limit=100')
      const json = await res.json()
      if (json.success) {
        const invoiceData = (json.data || []).map((inv: { id: string; invoiceNumber: string; type: string; status: string }) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          type: inv.type,
          status: inv.status,
        }))
        setInvoices(invoiceData)
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err)
    }
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  // Summary calculations
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0)
  const thisMonthPayments = payments
    .filter((p) => {
      const d = new Date(p.paymentDate)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, p) => sum + p.amount, 0)
  const receivablePayments = payments
    .filter((p) => p.invoice?.type === 'receivable')
    .reduce((sum, p) => sum + p.amount, 0)
  const payablePayments = payments
    .filter((p) => p.invoice?.type === 'payable')
    .reduce((sum, p) => sum + p.amount, 0)

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: formInvoiceId,
          amount: parseFloat(formAmount) || 0,
          currency: formCurrency,
          exchangeRate: parseFloat(formExchangeRate) || 1,
          paymentMethod: formPaymentMethod,
          reference: formReference || null,
          paymentDate: formDate || new Date().toISOString(),
          notes: formNotes || null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setShowCreateDialog(false)
        resetForm()
        fetchPayments()
      } else {
        console.error('Failed to create payment:', json.error)
      }
    } catch (err) {
      console.error('Failed to create payment:', err)
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    setFormInvoiceId('')
    setFormAmount('')
    setFormCurrency('USD')
    setFormExchangeRate('1')
    setFormPaymentMethod('bank_transfer')
    setFormReference('')
    setFormDate(format(new Date(), 'yyyy-MM-dd'))
    setFormNotes('')
  }

  // Filter unpaid invoices for the select
  const availableInvoices = invoices.filter(
    (inv) => inv.status !== 'paid' && inv.status !== 'cancelled'
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="size-6 text-emerald-600" />
            Payments
          </h1>
          <p className="text-muted-foreground text-sm">
            Record and track all payment transactions
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="size-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {currencyFormatter.format(totalPayments)}
                </p>
              </div>
              <div className="size-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <DollarSign className="size-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-teal-600">
                  {currencyFormatter.format(thisMonthPayments)}
                </p>
              </div>
              <div className="size-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                <Calendar className="size-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receivable</p>
                <p className="text-2xl font-bold text-green-600">
                  {currencyFormatter.format(receivablePayments)}
                </p>
              </div>
              <div className="size-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                <ArrowUpRight className="size-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payable</p>
                <p className="text-2xl font-bold text-amber-600">
                  {currencyFormatter.format(payablePayments)}
                </p>
              </div>
              <div className="size-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                <ArrowDownLeft className="size-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select
              value={paymentMethodFilter}
              onValueChange={(v) => {
                setPaymentMethodFilter(v === 'all' ? '' : v)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Payment Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Methods</SelectItem>
                {Object.entries(paymentMethodLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
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
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End date"
            />
            <Button
              variant="outline"
              onClick={() => {
                setPaymentMethodFilter('')
                setStartDate('')
                setEndDate('')
                setPage(1)
              }}
            >
              <Filter className="size-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Payment Records
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
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Wallet className="size-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No payments found</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                {paymentMethodFilter || startDate || endDate
                  ? 'Try adjusting your filters'
                  : 'Record your first payment to get started'}
              </p>
              {!paymentMethodFilter && !startDate && !endDate && (
                <Button
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="size-4 mr-2" />
                  Record Payment
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[calc(100vh-440px)] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Payment #</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p, idx) => (
                      <TableRow key={p.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium whitespace-nowrap">
                          PAY-{String(idx + 1 + (page - 1) * 20).padStart(4, '0')}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            {p.invoice?.type === 'receivable' ? (
                              <ArrowUpRight className="size-3 text-emerald-500" />
                            ) : (
                              <ArrowDownLeft className="size-3 text-teal-500" />
                            )}
                            <span
                              className={
                                p.invoice?.type === 'receivable'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-teal-600 dark:text-teal-400'
                              }
                            >
                              {p.invoice?.invoiceNumber || '—'}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold whitespace-nowrap">
                          {currencyFormatter.format(p.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {p.currency}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {p.paymentMethod ? (
                            <Badge
                              variant="secondary"
                              className={
                                paymentMethodColors[p.paymentMethod] || ''
                              }
                            >
                              {p.paymentMethod === 'bank_transfer' && (
                                <Banknote className="size-3 mr-1" />
                              )}
                              {paymentMethodLabels[p.paymentMethod] || p.paymentMethod}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate text-sm">
                          {p.reference || '—'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(p.paymentDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">
                          {p.notes || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
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

      {/* Record Payment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a new payment against an invoice
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 pr-4">
              <div className="space-y-2">
                <Label>Invoice</Label>
                <Select value={formInvoiceId} onValueChange={setFormInvoiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInvoices.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        <span className="flex items-center gap-2">
                          {inv.type === 'receivable' ? (
                            <ArrowUpRight className="size-3 text-emerald-500" />
                          ) : (
                            <ArrowDownLeft className="size-3 text-teal-500" />
                          )}
                          {inv.invoiceNumber}
                          <span className="text-muted-foreground">({inv.type})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Exchange Rate</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="1.00"
                    value={formExchangeRate}
                    onChange={(e) => setFormExchangeRate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={formPaymentMethod} onValueChange={setFormPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(paymentMethodLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reference</Label>
                  <Input
                    placeholder="Payment reference..."
                    value={formReference}
                    onChange={(e) => setFormReference(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Date</Label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
              </div>

              {formCurrency !== 'USD' && formAmount && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Base currency equivalent:{' '}
                    <span className="font-semibold text-foreground">
                      {currencyFormatter.format(
                        (parseFloat(formAmount) || 0) * (parseFloat(formExchangeRate) || 1)
                      )}
                    </span>
                  </p>
                </div>
              )}

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
              disabled={creating || !formInvoiceId || !formAmount}
            >
              {creating ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
