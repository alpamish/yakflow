'use client'

import React, { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface ForecastUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ForecastUploadDialog({ open, onOpenChange, onSuccess }: ForecastUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selected: File | null) => {
    setError(null)
    setSuccess(null)
    if (!selected) {
      setFile(null)
      return
    }
    const ext = selected.name.split('.').pop()?.toLowerCase()
    if (!ext || !['xlsx', 'xls'].includes(ext)) {
      setError('Only .xlsx and .xls files are accepted.')
      return
    }
    if (selected.size > 25 * 1024 * 1024) {
      setError('File size must be under 25 MB.')
      return
    }
    setFile(selected)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const dropped = e.dataTransfer.files[0]
    handleFileSelect(dropped)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    setSuccess(null)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 180000)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/forecast', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })
      const json = await res.json()

      if (!json.success) {
        setError(json.error || 'Upload failed')
        return
      }

      const { summary } = json.data
      const parts: string[] = []
      if (summary.updates > 0) parts.push(`${summary.updates} values updated`)
      if (summary.newRows > 0) parts.push(`${summary.newRows} new rows`)
      if (summary.removedRows > 0) parts.push(`${summary.removedRows} rows removed`)
      const msg = parts.length > 0
        ? `Uploaded successfully. ${parts.join(', ')}.`
        : 'Uploaded successfully. No changes detected.'

      setSuccess(msg)
      setTimeout(() => {
        onOpenChange(false)
        setFile(null)
        setSuccess(null)
        onSuccess()
      }, 1500)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Upload timed out. Please try again with a smaller file.')
      } else {
        setError('Failed to upload file. Please try again.')
      }
      console.error('Upload error:', err)
    } finally {
      clearTimeout(timeout)
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (uploading) return
    setFile(null)
    setError(null)
    setSuccess(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-5 text-emerald-600" />
            Upload Forecast File
          </DialogTitle>
          <DialogDescription>
            Upload an Excel forecast file (.xlsx). It will be parsed and compared with the previous version.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* File Drop Zone */}
          <div className="space-y-2">
            <Label>Excel File</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                  : 'border-muted-foreground/25 hover:border-emerald-500/50 hover:bg-muted/50'
              } ${file ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileSpreadsheet className="size-10 text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 gap-1"
                    onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  >
                    <X className="size-3" />
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="size-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {isDragOver ? 'Drop file here' : 'Drag & drop Excel file here'}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    or click to browse (.xlsx, up to 25 MB)
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 rounded-md p-3">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 rounded-md p-3">
              <CheckCircle2 className="size-4 shrink-0" />
              {success}
            </div>
          )}

          {/* Info */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">Auto-compare with previous version</Badge>
            <Badge variant="secondary" className="text-xs">Row matching by identifiers</Badge>
            <Badge variant="secondary" className="text-xs">Change tracking preserved</Badge>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'Uploading & Parsing...' : 'Upload Forecast'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
