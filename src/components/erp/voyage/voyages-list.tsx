'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Ship,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  ArrowUpDown,
  MapPin,
  Calendar,
  Anchor,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { useNavigationStore } from '@/lib/store'
import { VoyageForm } from './voyage-form'

const statusConfig: Record<string, { label: string; color: string }> = {
  planned: { label: 'Planned', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  loading: { label: 'Loading', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  departed: { label: 'Departed', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  in_transit: { label: 'In Transit', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  arrived: { label: 'Arrived', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface Voyage {
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
  teuSummary: { totalTEUs: number; loadedTEUs: number; teuUtilization: number | null } | null
  totalRevenue: number
  totalExpenses: number
  createdAt: string
}

export function VoyagesList() {
  const { selectVoyage } = useNavigationStore()
  const [voyages, setVoyages] = useState<Voyage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editVoyage, setEditVoyage] = useState<Voyage | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchVoyages = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
      })
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`/api/voyages?${params}`)
      const data = await res.json()
      if (data.success) {
        setVoyages(data.data || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotal(data.pagination?.total || 0)
      }
    } catch {
      console.error('Failed to fetch voyages')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    fetchVoyages()
  }, [fetchVoyages])

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/voyages/${id}`, { method: 'DELETE' })
      setDeleteId(null)
      fetchVoyages()
    } catch {
      console.error('Failed to delete voyage')
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditVoyage(null)
    fetchVoyages()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-3 bg-amber-50 dark:bg-amber-950/30">
            <Ship className="size-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Voyage Finance & TEU Management</h1>
            <p className="text-muted-foreground text-sm">
              {total} voyage{total !== 1 ? 's' : ''} total
            </p>
          </div>
        </div>
        <Button
          onClick={() => { setEditVoyage(null); setShowForm(true) }}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Plus className="size-4 mr-2" />
          New Voyage
        </Button>
      </div>

      <Separator />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search voyages, vessels, routes..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="size-4 mr-2" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Voyage #</TableHead>
                  <TableHead className="font-semibold">Vessel</TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">Route</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Ports</TableHead>
                  <TableHead className="font-semibold hidden xl:table-cell">ETD / ETA</TableHead>
                  <TableHead className="font-semibold hidden xl:table-cell">Shipping Line</TableHead>
                  <TableHead className="font-semibold text-right">TEUs</TableHead>
                  <TableHead className="font-semibold text-right">Revenue</TableHead>
                  <TableHead className="font-semibold text-right">Expenses</TableHead>
                  <TableHead className="font-semibold text-right">Net Profit</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 12 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full max-w-[80px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : voyages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Anchor className="size-12 opacity-40" />
                        <p className="text-lg font-medium">No voyages found</p>
                        <p className="text-sm">Create your first voyage to get started</p>
                        <Button
                          onClick={() => { setEditVoyage(null); setShowForm(true) }}
                          variant="outline"
                          className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
                        >
                          <Plus className="size-4 mr-2" />
                          New Voyage
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  voyages.map((voyage) => {
                    const netProfit = voyage.totalRevenue - voyage.totalExpenses
                    const status = statusConfig[voyage.status] || statusConfig.planned
                    return (
                      <TableRow key={voyage.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => selectVoyage(voyage.id)}>
                        <TableCell>
                          <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">
                            {voyage.voyageNumber}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{voyage.vesselName}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {voyage.sailingRoute || '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="size-3 text-muted-foreground shrink-0" />
                            <span className="truncate max-w-[120px]">{voyage.departurePort || '—'}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="truncate max-w-[120px]">{voyage.arrivalPort || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="size-3 text-muted-foreground" />
                            <span>{formatDate(voyage.etd)}</span>
                            <span className="text-muted-foreground">/</span>
                            <span>{formatDate(voyage.eta)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-muted-foreground text-sm">
                          {voyage.shippingLine || '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {voyage.teuSummary?.totalTEUs ?? 0}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(voyage.totalRevenue)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(voyage.totalExpenses)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">
                          <span className={netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                            {formatCurrency(netProfit)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-xs ${status.color}`}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <ArrowUpDown className="size-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); selectVoyage(voyage.id) }}>
                                <Eye className="size-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditVoyage(voyage); setShowForm(true) }}>
                                <Pencil className="size-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={(e) => { e.stopPropagation(); setDeleteId(voyage.id) }}
                              >
                                <Trash2 className="size-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
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
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteId(null)}>
          <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Delete Voyage</h3>
              <p className="text-muted-foreground">Are you sure you want to delete this voyage? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(deleteId)}
                >
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Voyage Form Dialog */}
      {showForm && (
        <VoyageForm
          voyage={editVoyage}
          onClose={() => { setShowForm(false); setEditVoyage(null) }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}
