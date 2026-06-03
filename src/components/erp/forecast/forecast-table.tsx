'use client'

import React, { useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Pencil,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface ChangeInfo {
  changeType: 'updated' | 'new' | 'removed'
  field: string | null
  oldValue: string | null
  newValue: string | null
  rowIndex: number | null
  uploadedBy?: string
  createdAt?: string
}

export interface ForecastRowData {
  id: string
  forecastFileId: string
  rowIndex: number
  voyageNumber: string | null
  containerNumber: string | null
  shipmentId: string | null
  bookingRef: string | null
  parsedData: Record<string, string>
}

interface ForecastTableProps {
  headers: string[]
  rows: ForecastRowData[]
  changes: ChangeInfo[]
  loading: boolean
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}

export function ForecastTable({
  headers,
  rows,
  changes,
  loading,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: ForecastTableProps) {
  const changeMap = useMemo(() => {
    const updated = new Map<string, ChangeInfo>()
    const newRows = new Set<number>()
    const removedRows = new Set<number>()

    for (const c of changes) {
      if (c.changeType === 'updated' && c.field !== null && c.rowIndex !== null) {
        const key = `${c.rowIndex}::${c.field}`
        updated.set(key, c)
      } else if (c.changeType === 'new' && c.rowIndex !== null) {
        newRows.add(c.rowIndex)
      } else if (c.changeType === 'removed' && c.rowIndex !== null) {
        removedRows.add(c.rowIndex)
      }
    }

    return { updated, newRows, removedRows }
  }, [changes])

  const getCellStyle = (rowIndex: number, field: string): string => {
    const key = `${rowIndex}::${field}`
    if (changeMap.updated.has(key)) return 'bg-amber-100 dark:bg-amber-900/30'
    return ''
  }

  const getRowStyle = (rowIndex: number): string => {
    if (changeMap.newRows.has(rowIndex)) return 'bg-emerald-50/80 dark:bg-emerald-950/20'
    if (changeMap.removedRows.has(rowIndex)) return 'bg-red-50/80 dark:bg-red-950/20'
    return ''
  }

  const getRowBadge = (rowIndex: number): React.ReactNode => {
    if (changeMap.newRows.has(rowIndex)) {
      return (
        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] px-1.5 py-0 h-4">
          <Plus className="size-2.5 mr-0.5" />
          New
        </Badge>
      )
    }
    if (changeMap.removedRows.has(rowIndex)) {
      return (
        <Badge variant="outline" className="text-red-600 border-red-300 dark:border-red-700 text-[10px] px-1.5 py-0 h-4">
          <Minus className="size-2.5 mr-0.5" />
          Removed
        </Badge>
      )
    }
    return null
  }

  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="w-[60px] sticky left-0 bg-background z-20">#</TableHead>
              {headers.map((header) => (
                <TableHead key={header} className="whitespace-nowrap font-semibold text-xs">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="sticky left-0 bg-background"><Skeleton className="h-4 w-6" /></TableCell>
                  {headers.map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length + 1} className="text-center py-12 text-muted-foreground">
                  No forecast data available
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={`hover:bg-muted/30 transition-colors ${getRowStyle(row.rowIndex)}`}
                >
                  <TableCell className="sticky left-0 bg-background z-10 text-xs text-muted-foreground font-mono">
                    <div className="flex items-center gap-1.5">
                      {getRowBadge(row.rowIndex)}
                      {row.rowIndex + 1}
                    </div>
                  </TableCell>
                  {headers.map((header) => {
                    const value = row.parsedData[header] ?? ''
                    const cellChange = changeMap.updated.get(`${row.rowIndex}::${header}`)
                    const cellClass = getCellStyle(row.rowIndex, header)

                    if (cellChange) {
                      return (
                        <TableCell key={header} className={`p-0 ${cellClass}`}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="px-3 py-2 cursor-default min-w-[80px]">
                                <div className="flex items-center gap-1">
                                  <Pencil className="size-3 text-amber-600 shrink-0" />
                                  <span className="text-sm font-medium">{value}</span>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[260px] text-xs space-y-1">
                              <div className="flex items-center gap-1 text-amber-600 font-medium">
                                <Pencil className="size-3" />
                                Value Updated
                              </div>
                              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
                                <span className="text-muted-foreground">Previous:</span>
                                <span className="line-through">{cellChange.oldValue || '—'}</span>
                                <span className="text-muted-foreground">New:</span>
                                <span className="font-medium text-emerald-600">{cellChange.newValue || '—'}</span>
                                <span className="text-muted-foreground">Updated by:</span>
                                <span>{cellChange.uploadedBy || 'Unknown'}</span>
                                {cellChange.createdAt && (
                                  <>
                                    <span className="text-muted-foreground">Date:</span>
                                    <span>{new Date(cellChange.createdAt).toLocaleString()}</span>
                                  </>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                      )
                    }

                    return (
                      <TableCell key={header} className={cellClass}>
                        <span className="text-sm">{value}</span>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startItem}–{endItem} of {total} rows
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNum = i + 1
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? 'default' : 'outline'}
                  size="icon"
                  className={`size-8 ${pageNum === page ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
