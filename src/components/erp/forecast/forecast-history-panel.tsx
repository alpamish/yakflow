'use client'

import React from 'react'
import {
  History,
  FileSpreadsheet,
  Upload,
  User,
  Calendar,
  GitCompare,
  ArrowRight,
  Layers,
  Trash2,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export interface ForecastFileSummary {
  id: string
  version: number
  originalName: string
  uploadedBy: string
  fileSize: number
  rowCount: number
  changeSummary: string | null
  createdAt: string
}

interface ForecastHistoryPanelProps {
  files: ForecastFileSummary[]
  activeVersion: number | null
  compareVersion: number | null
  loading: boolean
  onSelectVersion: (file: ForecastFileSummary) => void
  onCompare: (version: number) => void
  onClearCompare: () => void
  onDelete: (file: ForecastFileSummary) => void
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

export function ForecastHistoryPanel({
  files,
  activeVersion,
  compareVersion,
  loading,
  onSelectVersion,
  onCompare,
  onClearCompare,
  onDelete,
}: ForecastHistoryPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <History className="size-4 text-emerald-600" />
        <h3 className="text-sm font-semibold">Version History</h3>
        {files.length > 0 && (
          <Badge variant="secondary" className="text-xs ml-auto">{files.length} versions</Badge>
        )}
      </div>

      <Separator />

      {compareVersion !== null && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 rounded-md p-2 text-xs">
          <GitCompare className="size-3.5 text-amber-600 shrink-0" />
          <span className="text-amber-800 dark:text-amber-300 flex-1">
            Comparing v{compareVersion} with v{activeVersion}
          </span>
          <Button variant="ghost" size="icon" className="size-5" onClick={onClearCompare}>
            <span className="sr-only">Clear</span>
            <svg width="10" height="10" viewBox="0 0 15 15" fill="none">
              <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80709 2.99385 3.44302 2.99385 3.21847 3.2184C2.99392 3.44295 2.99392 3.80702 3.21847 4.03157L6.68688 7.49999L3.21847 10.9684C2.99392 11.1929 2.99392 11.557 3.21847 11.7815C3.44302 12.0061 3.80709 12.0061 4.03164 11.7815L7.50005 8.31316L10.9685 11.7815C11.193 12.0061 11.5571 12.0061 11.7816 11.7815C12.0062 11.557 12.0062 11.1929 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" />
            </svg>
          </Button>
        </div>
      )}

      <ScrollArea className="h-[calc(100vh-28rem)] min-h-[300px]">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 border rounded-lg space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Upload className="size-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No versions yet</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">Upload a forecast file to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => {
              const isActive = file.version === activeVersion
              const isCompareTarget = file.version === compareVersion
              let summary: { updates: number; newRows: number; removedRows: number } | null = null
              if (file.changeSummary) {
                try {
                  const raw = JSON.parse(file.changeSummary)
                  summary = {
                    updates: raw.updates ?? 0,
                    newRows: raw.newRows ?? 0,
                    removedRows: raw.removedRows ?? 0,
                  }
                } catch { /* ignore */ }
              }

              return (
                <div
                  key={file.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    isActive
                      ? 'border-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/20 dark:border-emerald-700'
                      : isCompareTarget
                      ? 'border-amber-400 bg-amber-50/80 dark:bg-amber-950/20 dark:border-amber-700'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => onSelectVersion(file)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`size-7 rounded flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <FileSpreadsheet className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold">v{file.version}</span>
                          {isActive && (
                            <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 h-4">Active</Badge>
                          )}
                          {isCompareTarget && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px] px-1.5 h-4">
                              Compare
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {file.originalName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!isActive && !isCompareTarget && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 shrink-0"
                          onClick={(e) => { e.stopPropagation(); onCompare(file.version) }}
                        >
                          <GitCompare className="size-3" />
                          <span className="sr-only">Compare</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={(e) => { e.stopPropagation(); onDelete(file) }}
                      >
                        <Trash2 className="size-3" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="size-3" />
                      {file.uploadedBy}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                    </span>
                    <span>{formatFileSize(file.fileSize)}</span>
                    <span>{file.rowCount} rows</span>
                  </div>

                  {/* Change summary */}
                  {summary && (summary.updates || summary.newRows || summary.removedRows) && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {summary.updates > 0 && (
                        <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          {summary.updates} updated
                        </Badge>
                      )}
                      {summary.newRows > 0 && (
                        <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {summary.newRows} new
                        </Badge>
                      )}
                      {summary.removedRows > 0 && (
                        <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          {summary.removedRows} removed
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
