'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Upload,
  TrendingUp,
  FileSpreadsheet,
  Search,
  Filter,
  X,
  BarChart3,
  Layers,
  RefreshCw,
  FileText,
  Maximize2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useSession } from 'next-auth/react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

import { ForecastUploadDialog } from './forecast-upload-dialog'
import { ForecastTable, type ForecastRowData, type ChangeInfo } from './forecast-table'
import { ForecastHistoryPanel, type ForecastFileSummary } from './forecast-history-panel'
import { ForecastLegend } from './forecast-legend'

interface FileDetailData {
  file: ForecastFileSummary
  rows: ForecastRowData[]
  headers: string[]
}

interface ChangesData {
  changes: ChangeInfo[]
  summary: { updates: number; newRows: number; removedRows: number } | null
  version: number
  comparedToVersion: number | null
}

export function ForecastPage() {
  const { data: session } = useSession()

  // Upload dialog
  const [uploadOpen, setUploadOpen] = useState(false)

  // File list
  const [files, setFiles] = useState<ForecastFileSummary[]>([])
  const [filesLoading, setFilesLoading] = useState(true)

  // Active version
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [activeVersion, setActiveVersion] = useState<number | null>(null)

  // Active data
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<ForecastRowData[]>([])
  const [changes, setChanges] = useState<ChangeInfo[]>([])
  const [changeSummary, setChangeSummary] = useState<{ updates: number; newRows: number; removedRows: number } | null>(null)
  const [dataLoading, setDataLoading] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Comparison mode
  const [compareVersion, setCompareVersion] = useState<number | null>(null)
  const [compareFileId, setCompareFileId] = useState<string | null>(null)
  const [compareRows, setCompareRows] = useState<ForecastRowData[]>([])
  const [compareChanges, setCompareChanges] = useState<ChangeInfo[]>([])
  const [compareHeaders, setCompareHeaders] = useState<string[]>([])

  // Search/filter
  const [searchQuery, setSearchQuery] = useState('')

  // Fullscreen
  const [fullscreenOpen, setFullscreenOpen] = useState(false)

  const handleDownloadPdf = async () => {
    if (rows.length === 0 || dataLoading) return

    try {
      const { pdf } = await import('@react-pdf/renderer')
      const { ForecastPDF } = await import('./forecast-pdf')

      const blob = await pdf(
        <ForecastPDF
          headers={orderedHeaders}
          rows={rows}
          changes={mergedChanges}
          version={activeVersion}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `forecast-data-v${activeVersion ?? 'latest'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation failed:', err)
    }
  }

  // Fetch file list
  const fetchFiles = useCallback(async () => {
    try {
      setFilesLoading(true)
      const res = await fetch('/api/forecast?limit=100')
      const json = await res.json()
      if (json.success) {
        setFiles(json.data)
      }
    } catch (err) {
      console.error('Error fetching forecast files:', err)
    } finally {
      setFilesLoading(false)
    }
  }, [])

  // Auto-select latest file when files load and nothing is active
  useEffect(() => {
    if (files.length > 0 && !activeFileId) {
      const latest = files[0]
      setActiveFileId(latest.id)
      setActiveVersion(latest.version)
    }
  }, [files, activeFileId])

  // Fetch active file data
  const fetchFileData = useCallback(async (fileId: string, pageNum: number) => {
    try {
      setDataLoading(true)
      const [fileRes, changesRes] = await Promise.all([
        fetch(`/api/forecast/${fileId}?page=${pageNum}&limit=50`),
        fetch(`/api/forecast/${fileId}/changes`),
      ])
      const fileJson = await fileRes.json() as { success: boolean; data: FileDetailData; pagination: { page: number; limit: number; total: number; totalPages: number } }
      const changesJson = await changesRes.json() as { success: boolean; data: ChangesData }

      if (fileJson.success) {
        setHeaders(fileJson.data.headers)
        setRows(fileJson.data.rows)
        setTotal(fileJson.pagination.total)
        setTotalPages(fileJson.pagination.totalPages)
        setPage(fileJson.pagination.page)
      }
      if (changesJson.success) {
        setChanges(changesJson.data.changes)
        setChangeSummary(changesJson.data.summary)
      }
    } catch (err) {
      console.error('Error fetching file data:', err)
    } finally {
      setDataLoading(false)
    }
  }, [])

  // Fetch comparison file data
  const fetchCompareData = useCallback(async (fileId: string) => {
    try {
      const [fileRes, changesRes] = await Promise.all([
        fetch(`/api/forecast/${fileId}?limit=5000`),
        fetch(`/api/forecast/${fileId}/changes`),
      ])
      const fileJson = await fileRes.json() as { success: boolean; data: FileDetailData }
      const changesJson = await changesRes.json() as { success: boolean; data: ChangesData }

      if (fileJson.success) {
        setCompareHeaders(fileJson.data.headers)
        setCompareRows(fileJson.data.rows)
      }
      if (changesJson.success) {
        setCompareChanges(changesJson.data.changes)
      }
    } catch (err) {
      console.error('Error fetching compare data:', err)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  // Load data when active file changes
  useEffect(() => {
    if (activeFileId) {
      fetchFileData(activeFileId, page)
    }
  }, [activeFileId, fetchFileData])

  // Reload when page changes
  useEffect(() => {
    if (activeFileId) {
      fetchFileData(activeFileId, page)
    }
  }, [page])

  // Load comparison data when compare version changes
  useEffect(() => {
    if (compareFileId) {
      fetchCompareData(compareFileId)
    }
  }, [compareFileId, fetchCompareData])

  // Upload success handler
  const handleUploadSuccess = () => {
    setCompareVersion(null)
    setCompareFileId(null)
    setCompareRows([])
    setCompareChanges([])
    setActiveFileId(null)
    setActiveVersion(null)
    setPage(1)
    fetchFiles()
  }

  // Select a version from history
  const handleSelectVersion = (file: ForecastFileSummary) => {
    setActiveFileId(file.id)
    setActiveVersion(file.version)
    setPage(1)
    setCompareVersion(null)
    setCompareFileId(null)
    setCompareRows([])
    setCompareChanges([])
  }

  // Start comparison
  const handleCompare = (version: number) => {
    if (version === activeVersion) return
    const target = files.find((f) => f.version === version)
    if (target) {
      setCompareVersion(version)
      setCompareFileId(target.id)
    }
  }

  const handleClearCompare = () => {
    setCompareVersion(null)
    setCompareFileId(null)
    setCompareRows([])
    setCompareChanges([])
  }

  // Delete a forecast file
  const handleDelete = async (file: ForecastFileSummary) => {
    const label = `v${file.version} — ${file.originalName}`
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return

    try {
      const res = await fetch(`/api/forecast/${file.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) {
        alert(json.error || 'Failed to delete')
        return
      }
      if (activeFileId === file.id) {
        setActiveFileId(null)
        setActiveVersion(null)
      }
      fetchFiles()
    } catch {
      alert('Failed to delete forecast file.')
    }
  }

  // Refresh current data
  const handleRefresh = () => {
    if (activeFileId) {
      fetchFileData(activeFileId, page)
      if (compareFileId) fetchCompareData(compareFileId)
    }
  }

  // Merge changes: both current and comparison changes
  const mergedChanges: ChangeInfo[] = useMemo(() => {
    if (compareVersion !== null) {
      return [...changes, ...compareChanges]
    }
    return changes
  }, [changes, compareChanges, compareVersion])

  // Reorder columns: move 20 and 40 after BOOKING RELEASE DATE
  const orderedHeaders = useMemo(() => {
    const bookingKey = 'BOOKING RELEASE DATE'
    const bookingIdx = headers.indexOf(bookingKey)
    if (bookingIdx === -1) return headers

    const result = [...headers]
    const col20 = '20'
    const col40 = '40'

    const idx40 = result.indexOf(col40)
    if (idx40 !== -1) result.splice(idx40, 1)

    const idx20 = result.indexOf(col20)
    if (idx20 !== -1) result.splice(idx20, 1)

    const newBookingIdx = result.indexOf(bookingKey)
    result.splice(newBookingIdx + 1, 0, col20, col40)

    return result
  }, [headers])

  const activeFile = files.find((f) => f.id === activeFileId)
  const totalUpdates = changeSummary
    ? changeSummary.updates + changeSummary.newRows + changeSummary.removedRows
    : 0

  return (
    <div className="flex flex-col h-full overflow-hidden gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-3 bg-emerald-50 dark:bg-emerald-950/30">
            <TrendingUp className="size-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Forecast Management</h1>
            <p className="text-sm text-muted-foreground">
              Planning and forecast tracking system
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeFile && (
            <Badge variant="outline" className="text-xs gap-1">
              <Layers className="size-3" />
              v{activeFile.version}
            </Badge>
          )}
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            onClick={handleRefresh}
            disabled={dataLoading}
          >
            <RefreshCw className={`size-4 ${dataLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="size-4" />
            Upload Forecast
          </Button>
        </div>
      </div>

      {/* Notification Banner */}
      {changeSummary && totalUpdates > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-sm shrink-0">
          <BarChart3 className="size-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <span className="font-medium text-amber-800 dark:text-amber-300">
              Forecast updated {activeFile ? `v${activeFile.version}` : ''}
            </span>
            <span className="text-amber-700 dark:text-amber-400 ml-1">
              — {changeSummary.updates} values changed, {changeSummary.newRows} new rows, {changeSummary.removedRows} rows removed
            </span>
            {activeFile && (
              <span className="text-amber-600/70 dark:text-amber-500/70 ml-1">
                (by {activeFile.uploadedBy}, {formatDistanceToNow(new Date(activeFile.createdAt), { addSuffix: true })})
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-amber-600"
            onClick={() => setChangeSummary(null)}
          >
            <X className="size-3" />
          </Button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Forecasts</p>
                <p className="text-2xl font-bold mt-1">{files.length}</p>
              </div>
              <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <FileSpreadsheet className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Version</p>
                <p className="text-2xl font-bold mt-1">{activeVersion ? `v${activeVersion}` : '—'}</p>
              </div>
              <div className="size-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <Layers className="size-5 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Forecast Rows</p>
                <p className="text-2xl font-bold mt-1">{activeFile?.rowCount ?? '—'}</p>
              </div>
              <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <BarChart3 className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Changes</p>
                <p className="text-2xl font-bold mt-1">{totalUpdates}</p>
              </div>
              <div className="size-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <TrendingUp className="size-5 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: History Sidebar + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 flex-1 min-h-0 overflow-hidden">
        {/* History Panel */}
        <Card className="h-fit lg:sticky lg:top-6">
          <CardContent className="p-4">
            <ForecastHistoryPanel
              files={files}
              activeVersion={activeVersion}
              compareVersion={compareVersion}
              loading={filesLoading}
              onSelectVersion={handleSelectVersion}
              onCompare={handleCompare}
              onClearCompare={handleClearCompare}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>

        {/* Table Section */}
        <div className="flex flex-col gap-4 min-h-0 overflow-hidden">
          {/* Filter Bar + Legend */}
          <Card className="shrink-0">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                  <Filter className="size-4" />
                  <span>Filters:</span>
                </div>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search rows..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 size-7"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="size-3" />
                    </Button>
                  )}
                </div>
                <ForecastLegend />
              </div>
            </CardContent>
          </Card>

          {/* Last Updated Info */}
          {activeFile && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
              <span>Version <strong>v{activeFile.version}</strong></span>
              <span>·</span>
              <span>Uploaded by <strong>{activeFile.uploadedBy}</strong></span>
              <span>·</span>
              <span>{formatDistanceToNow(new Date(activeFile.createdAt), { addSuffix: true })}</span>
              <span>·</span>
              <span>{activeFile.originalName}</span>
            </div>
          )}

          {/* Comparison mode indicator */}
          {compareVersion !== null && compareFileId && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10 shrink-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Comparing v{compareVersion}</span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="font-medium">v{activeVersion}</span>
                    <Badge variant="outline" className="text-xs ml-2">
                      {compareRows.length} rows vs {rows.length} rows
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleClearCompare}>
                    <X className="size-3 mr-1" />
                    Close Compare
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Forecast Table */}
          <Card className="flex flex-col min-h-0 flex-1">
            <CardHeader className="pb-3 shrink-0">
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="size-4 text-emerald-600" />
                Forecast Data
                {total > 0 && (
                  <Badge variant="secondary" className="ml-2">{total} rows</Badge>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="ml-auto size-8"
                  onClick={() => setFullscreenOpen(true)}
                  disabled={rows.length === 0}
                >
                  <Maximize2 className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={handleDownloadPdf}
                  disabled={dataLoading || rows.length === 0}
                >
                  <FileText className="size-3.5" />
                  PDF
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0 overflow-auto">
              <ForecastTable
                headers={orderedHeaders}
                rows={rows}
                changes={mergedChanges}
                loading={dataLoading}
                page={page}
                totalPages={totalPages}
                total={total}
                limit={50}
                onPageChange={setPage}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Dialog */}
      <ForecastUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={handleUploadSuccess}
      />

      {/* Full-screen Table Dialog */}
      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent
          className="max-w-full sm:max-w-full max-h-[98vh] h-[98vh] flex flex-col p-0 gap-0"
          showCloseButton={false}
        >
          <DialogHeader className="px-4 py-3 border-b shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="size-4 text-emerald-600" />
              Forecast Data
              {total > 0 && (
                <Badge variant="secondary" className="ml-1">{total} rows</Badge>
              )}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setFullscreenOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-auto pb-3">
            <div className="p-4 h-full">
              <ForecastTable
                headers={orderedHeaders}
                rows={rows}
                changes={mergedChanges}
                loading={dataLoading}
                page={page}
                totalPages={totalPages}
                total={total}
                limit={50}
                onPageChange={setPage}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
