'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  FolderOpen,
  File,
  FileCheck,
  FilePlus,
  Calendar,
  User,
  HardDrive,
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// Types
interface Document {
  id: string
  entityType: string
  entityId: string | null
  documentType: string
  name: string
  fileUrl: string
  fileSize: number | null
  mimeType: string | null
  version: number
  uploadedBy: string | null
  createdAt: string
  updatedAt: string
}

interface DocumentsResponse {
  success: boolean
  data: Document[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Helpers
function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function getEntityTypeLabel(type: string): string {
  const map: Record<string, string> = {
    shipment: 'Shipment',
    voyage: 'Voyage',
    invoice: 'Invoice',
  }
  return map[type] || type
}

function getDocumentTypeLabel(type: string): string {
  const map: Record<string, string> = {
    bl_copy: 'BL Copy',
    invoice: 'Invoice',
    packing_list: 'Packing List',
    customs: 'Customs',
    delivery_order: 'Delivery Order',
    contract: 'Contract',
    receipt: 'Receipt',
    other: 'Other',
  }
  return map[type] || type
}

function getDocumentTypeBadgeColor(type: string): string {
  const map: Record<string, string> = {
    bl_copy: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    invoice: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    packing_list: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
    customs: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    delivery_order: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
    contract: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
    receipt: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  }
  return map[type] || 'bg-gray-100 text-gray-800'
}

function getEntityTypeBadgeColor(type: string): string {
  const map: Record<string, string> = {
    shipment: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    voyage: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    invoice: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  }
  return map[type] || 'bg-gray-100 text-gray-800'
}

type SortField = 'createdAt' | 'name' | 'documentType'
type SortOrder = 'asc' | 'desc'

export function DocumentsPage() {
  // State
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all')
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Sort
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Dialogs
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [uploading, setUploading] = useState(false)

  // Upload form
  const [uploadForm, setUploadForm] = useState({
    entityType: 'shipment',
    entityId: '',
    documentType: 'bl_copy',
    name: '',
  })
  const [isDragOver, setIsDragOver] = useState(false)

  // Summary
  const [summary, setSummary] = useState({
    total: 0,
    thisMonth: 0,
    blCopies: 0,
    invoices: 0,
  })

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())
      params.set('sortBy', sortField)
      params.set('sortOrder', sortOrder)
      if (entityTypeFilter !== 'all') params.set('entityType', entityTypeFilter)
      if (documentTypeFilter !== 'all') params.set('documentType', documentTypeFilter)
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/documents?${params.toString()}`)
      const json: DocumentsResponse = await res.json()

      if (json.success) {
        setDocuments(json.data)
        setPagination(prev => ({ ...prev, ...json.pagination }))

        // Calculate summary from all data (unfiltered)
        const summaryRes = await fetch('/api/documents?limit=1000')
        const summaryJson: DocumentsResponse = await summaryRes.json()
        if (summaryJson.success) {
          const allDocs = summaryJson.data
          const now = new Date()
          const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          setSummary({
            total: summaryJson.pagination.total,
            thisMonth: allDocs.filter(d => new Date(d.createdAt) >= thisMonthStart).length,
            blCopies: allDocs.filter(d => d.documentType === 'bl_copy').length,
            invoices: allDocs.filter(d => d.documentType === 'invoice').length,
          })
        }
      } else {
        setError('Failed to fetch documents')
      }
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError('Failed to fetch documents')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, sortField, sortOrder, entityTypeFilter, documentTypeFilter, searchQuery])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="size-3 opacity-30" />
    return sortOrder === 'asc'
      ? <ChevronUp className="size-3 text-emerald-600" />
      : <ChevronDown className="size-3 text-emerald-600" />
  }

  // Upload handler
  const handleUpload = async () => {
    if (!uploadForm.name.trim()) return
    try {
      setUploading(true)
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: uploadForm.entityType,
          entityId: uploadForm.entityId || null,
          documentType: uploadForm.documentType,
          name: uploadForm.name,
          fileUrl: `/uploads/${uploadForm.name.toLowerCase().replace(/\s+/g, '-')}`,
          fileSize: Math.floor(Math.random() * 5000000) + 50000,
          mimeType: 'application/pdf',
          version: 1,
          uploadedBy: 'John Doe',
        }),
      })
      if (res.ok) {
        setUploadDialogOpen(false)
        setUploadForm({ entityType: 'shipment', entityId: '', documentType: 'bl_copy', name: '' })
        fetchDocuments()
      }
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  // Delete handler
  const handleDelete = async () => {
    if (!selectedDoc) return
    try {
      await fetch(`/api/documents/${selectedDoc.id}`, { method: 'DELETE' })
      setDeleteDialogOpen(false)
      setSelectedDoc(null)
      fetchDocuments()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  // Reset filters
  const resetFilters = () => {
    setEntityTypeFilter('all')
    setDocumentTypeFilter('all')
    setSearchQuery('')
  }

  const hasActiveFilters = entityTypeFilter !== 'all' || documentTypeFilter !== 'all' || searchQuery !== ''

  // Loading skeleton
  if (loading && documents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Document Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload, organize, and manage your freight documents
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Upload className="size-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload a new document to the system. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entity Type</Label>
                  <Select
                    value={uploadForm.entityType}
                    onValueChange={(val) => setUploadForm(prev => ({ ...prev, entityType: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shipment">Shipment</SelectItem>
                      <SelectItem value="voyage">Voyage</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Entity ID / Reference</Label>
                  <Input
                    placeholder="e.g. SHP-2026-0001"
                    value={uploadForm.entityId}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, entityId: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select
                    value={uploadForm.documentType}
                    onValueChange={(val) => setUploadForm(prev => ({ ...prev, documentType: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bl_copy">BL Copy</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="packing_list">Packing List</SelectItem>
                      <SelectItem value="customs">Customs</SelectItem>
                      <SelectItem value="delivery_order">Delivery Order</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="receipt">Receipt</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Document Name</Label>
                  <Input
                    placeholder="e.g. Bill of Lading - SHP001"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>
              {/* Drag & Drop Zone */}
              <div className="space-y-2">
                <Label>File</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragOver
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                      : 'border-muted-foreground/25 hover:border-emerald-500/50 hover:bg-muted/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragOver(false) }}
                  onClick={() => {/* Placeholder - no actual file input */}}
                >
                  <Upload className="size-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {isDragOver ? 'Drop file here' : 'Drag & drop file here'}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    or click to browse (PDF, DOC, XLS, IMG up to 25MB)
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleUpload}
                disabled={uploading || !uploadForm.name.trim()}
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold mt-1">{summary.total}</p>
              </div>
              <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <FolderOpen className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold mt-1">{summary.thisMonth}</p>
              </div>
              <div className="size-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <Calendar className="size-5 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">BL Copies</p>
                <p className="text-2xl font-bold mt-1">{summary.blCopies}</p>
              </div>
              <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <FileCheck className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Invoices</p>
                <p className="text-2xl font-bold mt-1">{summary.invoices}</p>
              </div>
              <div className="size-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <FileText className="size-5 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <Filter className="size-4" />
              <span>Filters:</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="shipment">Shipment</SelectItem>
                  <SelectItem value="voyage">Voyage</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                </SelectContent>
              </Select>
              <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Doc Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doc Types</SelectItem>
                  <SelectItem value="bl_copy">BL Copy</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="packing_list">Packing List</SelectItem>
                  <SelectItem value="customs">Customs</SelectItem>
                  <SelectItem value="delivery_order">Delivery Order</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="receipt">Receipt</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
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
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="text-emerald-600 shrink-0" onClick={resetFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <File className="size-4 text-emerald-600" />
            Documents
            <Badge variant="secondary" className="ml-2">
              {pagination.total} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="size-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" className="mt-4" onClick={fetchDocuments}>
                Retry
              </Button>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderOpen className="size-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">No documents found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {hasActiveFilters
                  ? 'Try adjusting your filters or search query'
                  : 'Upload your first document to get started'}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" className="mt-4" onClick={resetFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  onClick={() => setUploadDialogOpen(true)}
                >
                  <Upload className="size-4" />
                  Upload Document
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Document Name <SortIcon field="name" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort('documentType')}
                      >
                        <div className="flex items-center gap-1">
                          Type <SortIcon field="documentType" />
                        </div>
                      </TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>File Size</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead
                        className="cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center gap-1">
                          Date <SortIcon field="createdAt" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 8 }).map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-full max-w-[100px]" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      documents.map((doc) => (
                        <TableRow key={doc.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <File className="size-4 text-muted-foreground shrink-0" />
                              <span className="font-medium text-sm truncate max-w-[200px]">
                                {doc.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${getDocumentTypeBadgeColor(doc.documentType)}`}
                            >
                              {getDocumentTypeLabel(doc.documentType)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge
                                variant="outline"
                                className={`text-xs w-fit ${getEntityTypeBadgeColor(doc.entityType)}`}
                              >
                                {getEntityTypeLabel(doc.entityType)}
                              </Badge>
                              {doc.entityId && (
                                <span className="text-xs text-muted-foreground font-mono">
                                  {doc.entityId}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <HardDrive className="size-3" />
                              {formatFileSize(doc.fileSize)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              v{doc.version}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1">
                              <User className="size-3 text-muted-foreground" />
                              {doc.uploadedBy || '—'}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex flex-col">
                              <span>{format(new Date(doc.createdAt), 'MMM d, yyyy')}</span>
                              <span className="text-xs">
                                {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <span className="sr-only">Actions</span>
                                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 7.5C6 8.32843 5.32843 9 4.5 9C3.67157 9 3 8.32843 3 7.5C3 6.67157 3.67157 6 4.5 6C5.32843 6 6 6.67157 6 7.5ZM9 7.5C9 8.32843 8.32843 9 7.5 9C6.67157 9 6 8.32843 6 7.5C6 6.67157 6.67157 6 7.5 6C8.32843 6 9 6.67157 9 7.5ZM10.5 9C11.3284 9 12 8.32843 12 7.5C12 6.67157 11.3284 6 10.5 6C9.67157 6 9 6.67157 9 7.5C9 8.32843 9.67157 9 10.5 9Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="gap-2">
                                  <Download className="size-4" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="gap-2"
                                  onClick={() => {
                                    setSelectedDoc(doc)
                                    setPreviewDialogOpen(true)
                                  }}
                                >
                                  <Eye className="size-4" />
                                  Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="gap-2 text-red-600 focus:text-red-600"
                                  onClick={() => {
                                    setSelectedDoc(doc)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="size-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }).map((_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? 'default' : 'outline'}
                        size="icon"
                        className={`size-8 ${pageNum === pagination.page ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="size-5 text-emerald-600" />
              Document Preview
            </DialogTitle>
            <DialogDescription>
              Document details and preview
            </DialogDescription>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              {/* Document Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Document Name</p>
                  <p className="text-sm font-medium">{selectedDoc.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Document Type</p>
                  <Badge className={`text-xs ${getDocumentTypeBadgeColor(selectedDoc.documentType)}`}>
                    {getDocumentTypeLabel(selectedDoc.documentType)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Entity</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${getEntityTypeBadgeColor(selectedDoc.entityType)}`}>
                      {getEntityTypeLabel(selectedDoc.entityType)}
                    </Badge>
                    {selectedDoc.entityId && (
                      <span className="text-xs font-mono text-muted-foreground">{selectedDoc.entityId}</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Version</p>
                  <Badge variant="outline" className="text-xs">v{selectedDoc.version}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Upload Date</p>
                  <p className="text-sm">{format(new Date(selectedDoc.createdAt), 'MMM d, yyyy h:mm a')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">File Size</p>
                  <p className="text-sm">{formatFileSize(selectedDoc.fileSize)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Uploaded By</p>
                  <p className="text-sm">{selectedDoc.uploadedBy || 'Unknown'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">MIME Type</p>
                  <p className="text-sm font-mono">{selectedDoc.mimeType || '—'}</p>
                </div>
              </div>

              <Separator />

              {/* Placeholder Preview Area */}
              <div className="border-2 border-dashed rounded-lg bg-muted/30 p-12 text-center">
                <FileText className="size-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-sm font-medium text-muted-foreground">File Preview</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Document preview will be displayed here when file viewing is enabled
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Close
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Download className="size-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedDoc?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
