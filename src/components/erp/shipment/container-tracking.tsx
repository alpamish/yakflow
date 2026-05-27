'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Container, Search, Filter, Package } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useNavigationStore } from '@/lib/store'

interface ContainerItem {
  id: string
  containerNumber: string
  containerType: string
  containerSize: string
  grossWeight: number | null
  status: string
  currentLocation: string | null
  deliveryStatus: string
  shipment: {
    id: string
    shipmentNumber: string
    direction: string
    status: string
  }
}

interface ShipmentData {
  id: string
  shipmentNumber: string
  direction: string
  status: string
  containers: ContainerItem[]
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

export function ContainerTracking() {
  const { selectShipment } = useNavigationStore()

  const [allContainers, setAllContainers] = useState<ContainerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [deliveryFilter, setDeliveryFilter] = useState('')

  const fetchContainers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/shipments?limit=100')
      const json = await res.json()
      if (json.success) {
        const containers: ContainerItem[] = []
        for (const shipment of json.data as ShipmentData[]) {
          // We need to fetch each shipment's containers
          try {
            const cRes = await fetch(`/api/shipments/${shipment.id}/containers`)
            const cJson = await cRes.json()
            if (cJson.success) {
              for (const c of cJson.data) {
                containers.push({
                  ...c,
                  shipment: {
                    id: shipment.id,
                    shipmentNumber: shipment.shipmentNumber,
                    direction: shipment.direction,
                    status: shipment.status,
                  },
                })
              }
            }
          } catch {
            // skip failed shipment container fetch
          }
        }
        setAllContainers(containers)
      }
    } catch (err) {
      console.error('Failed to fetch containers:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContainers()
  }, [fetchContainers])

  const filtered = allContainers.filter((c) => {
    if (search && !c.containerNumber.toLowerCase().includes(search.toLowerCase()) && !c.shipment.shipmentNumber.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && c.status !== statusFilter) return false
    if (typeFilter && c.containerType !== typeFilter) return false
    if (deliveryFilter && c.deliveryStatus !== deliveryFilter) return false
    return true
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Container Tracking</h1>
        <p className="text-muted-foreground text-sm">
          Real-time tracking and status monitoring for all containers across shipments
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search containers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Container Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="empty">Empty</SelectItem>
                <SelectItem value="loaded">Loaded</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="arrived">Arrived</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Container Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="20DC">20DC</SelectItem>
                <SelectItem value="40DC">40DC</SelectItem>
                <SelectItem value="40HC">40HC</SelectItem>
                <SelectItem value="Reefer">Reefer</SelectItem>
                <SelectItem value="Open Top">Open Top</SelectItem>
                <SelectItem value="Flat Rack">Flat Rack</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deliveryFilter} onValueChange={(v) => setDeliveryFilter(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Delivery Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Delivery</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="picked_up">Picked Up</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearch('')
                setStatusFilter('')
                setTypeFilter('')
                setDeliveryFilter('')
              }}
            >
              <Filter className="size-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: allContainers.length, color: 'text-foreground' },
          { label: 'Empty', value: allContainers.filter(c => c.status === 'empty').length, color: 'text-gray-600' },
          { label: 'Loaded', value: allContainers.filter(c => c.status === 'loaded').length, color: 'text-blue-600' },
          { label: 'In Transit', value: allContainers.filter(c => c.status === 'in_transit').length, color: 'text-teal-600' },
          { label: 'Delivered', value: allContainers.filter(c => c.status === 'delivered').length, color: 'text-emerald-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            All Containers
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filtered.length} shown)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Container className="size-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No containers found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {search || statusFilter || typeFilter || deliveryFilter
                  ? 'Try adjusting your filters'
                  : 'Containers will appear here when added to shipments'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[calc(100vh-360px)] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Container #</TableHead>
                    <TableHead>Shipment #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Delivery</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => selectShipment(c.shipment.id)}
                    >
                      <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                        {c.containerNumber}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.shipment.shipmentNumber}
                      </TableCell>
                      <TableCell>{c.containerType}</TableCell>
                      <TableCell>{c.containerSize}&apos;</TableCell>
                      <TableCell className="text-right text-sm">
                        {c.grossWeight ? `${c.grossWeight} kg` : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={containerStatusColors[c.status] || ''}>
                          {c.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-sm">
                        {c.currentLocation || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={deliveryStatusColors[c.deliveryStatus] || ''}>
                          {c.deliveryStatus.replace('_', ' ')}
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
