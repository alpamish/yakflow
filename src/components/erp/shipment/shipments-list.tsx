'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Package,
  Plus,
  Search,
  Ship,
  Plane,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react'
import { format } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useNavigationStore } from '@/lib/store'
import { ShipmentForm } from './shipment-form'

interface Shipment {
  id: string
  shipmentNumber: string
  direction: string
  transportMode: string
  customerId: string | null
  customer: { id: string; name: string; code: string } | null
  originCountry: string | null
  destinationCountry: string | null
  etd: string | null
  eta: string | null
  vesselName: string | null
  voyageNumber: string | null
  status: string
  containerCount: number
  totalExpenses: number
  totalRevenues: number
  createdAt: string
}

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

const directionColors: Record<string, string> = {
  import: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  export: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function TransportModeIcon({ mode }: { mode: string }) {
  switch (mode) {
    case 'sea':
      return <Ship className="size-3.5" />
    case 'air':
      return <Plane className="size-3.5" />
    case 'land':
      return <Truck className="size-3.5" />
    default:
      return <Ship className="size-3.5" />
  }
}

export function ShipmentsList() {
  const { selectShipment } = useNavigationStore()

  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [directionFilter, setDirectionFilter] = useState('')
  const [transportFilter, setTransportFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  // Form dialog
  const [showForm, setShowForm] = useState(false)
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null)

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Shipment | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchShipments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        sortBy,
        sortOrder,
      })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (directionFilter) params.set('direction', directionFilter)
      if (transportFilter) params.set('transportMode', transportFilter)

      const res = await fetch(`/api/shipments?${params}`)
      const json = await res.json()
      if (json.success) {
        setShipments(json.data || [])
        setTotalPages(json.pagination?.totalPages || 1)
        setTotal(json.pagination?.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch shipments:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, directionFilter, transportFilter, sortBy, sortOrder])

  useEffect(() => {
    fetchShipments()
  }, [fetchShipments])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/shipments/${deleteTarget.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setDeleteTarget(null)
        fetchShipments()
      }
    } catch (err) {
      console.error('Failed to delete shipment:', err)
    } finally {
      setDeleting(false)
    }
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingShipment(null)
    fetchShipments()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shipment Operations</h1>
          <p className="text-muted-foreground text-sm">
            Manage and track all your freight shipments
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => {
            setEditingShipment(null)
            setShowForm(true)
          }}
        >
          <Plus className="size-4 mr-2" />
          New Shipment
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search shipments..."
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
              value={directionFilter}
              onValueChange={(v) => {
                setDirectionFilter(v === 'all' ? '' : v)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Directions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="import">Import</SelectItem>
                <SelectItem value="export">Export</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={transportFilter}
              onValueChange={(v) => {
                setTransportFilter(v === 'all' ? '' : v)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Transport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transport</SelectItem>
                <SelectItem value="sea">Sea</SelectItem>
                <SelectItem value="air">Air</SelectItem>
                <SelectItem value="land">Land</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearch('')
                setStatusFilter('')
                setDirectionFilter('')
                setTransportFilter('')
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
              Shipments
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({total} total)
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : shipments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="size-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No shipments found</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                {search || statusFilter || directionFilter || transportFilter
                  ? 'Try adjusting your filters or search criteria'
                  : 'Create your first shipment to get started'}
              </p>
              {!search && !statusFilter && !directionFilter && !transportFilter && (
                <Button
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="size-4 mr-2" />
                  New Shipment
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[calc(100vh-340px)] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('shipmentNumber')}
                      >
                        <div className="flex items-center gap-1">
                          Shipment # <ArrowUpDown className="size-3" />
                        </div>
                      </TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Transport</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('etd')}
                      >
                        <div className="flex items-center gap-1">
                          ETD / ETA <ArrowUpDown className="size-3" />
                        </div>
                      </TableHead>
                      <TableHead>Vessel/Voyage</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-1">
                          Status <ArrowUpDown className="size-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-center">Containers</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((s) => (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() => selectShipment(s.id)}
                      >
                        <TableCell className="font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {s.shipmentNumber}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={directionColors[s.direction] || ''}
                          >
                            {s.direction === 'import' ? (
                              <ArrowDownLeft className="size-3 mr-1" />
                            ) : (
                              <ArrowUpRight className="size-3 mr-1" />
                            )}
                            {s.direction === 'import' ? 'Import' : 'Export'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <TransportModeIcon mode={s.transportMode} />
                            {s.transportMode.charAt(0).toUpperCase() + s.transportMode.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {s.customer?.name || '—'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {s.originCountry && s.destinationCountry
                            ? `${s.originCountry} → ${s.destinationCountry}`
                            : '—'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <div>
                            {s.etd ? format(new Date(s.etd), 'MMM dd') : '—'}
                            <span className="text-muted-foreground mx-1">/</span>
                            {s.eta ? format(new Date(s.eta), 'MMM dd') : '—'}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {s.vesselName || '—'}
                          {s.voyageNumber ? ` / ${s.voyageNumber}` : ''}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={statusColors[s.status] || ''}
                          >
                            {statusLabels[s.status] || s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{s.containerCount}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {currencyFormatter.format(s.totalRevenues)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {currencyFormatter.format(s.totalExpenses)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="sr-only">Actions</span>
                                <span>•••</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  selectShipment(s.id)
                                }}
                              >
                                <Eye className="size-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingShipment(s)
                                  setShowForm(true)
                                }}
                              >
                                <Pencil className="size-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteTarget(s)
                                }}
                              >
                                <Trash2 className="size-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* New/Edit Shipment Dialog */}
      <ShipmentForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (!open) setEditingShipment(null)
        }}
        shipment={editingShipment}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shipment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete shipment{' '}
              <strong>{deleteTarget?.shipmentNumber}</strong>? This action cannot be undone and will
              remove all associated containers, expenses, and revenues.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
