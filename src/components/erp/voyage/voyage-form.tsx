'use client'

import React, { useState } from 'react'
import { X, Loader2, Ship } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'loading', label: 'Loading' },
  { value: 'departed', label: 'Departed' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

interface VoyageFormProps {
  voyage?: {
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
  } | null
  onClose: () => void
  onSuccess: () => void
}

export function VoyageForm({ voyage, onClose, onSuccess }: VoyageFormProps) {
  const isEdit = !!voyage
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    vesselName: voyage?.vesselName || '',
    sailingRoute: voyage?.sailingRoute || '',
    departurePort: voyage?.departurePort || '',
    arrivalPort: voyage?.arrivalPort || '',
    etd: voyage?.etd ? new Date(voyage.etd).toISOString().slice(0, 10) : '',
    eta: voyage?.eta ? new Date(voyage.eta).toISOString().slice(0, 10) : '',
    shippingLine: voyage?.shippingLine || '',
    status: voyage?.status || 'planned',
    remarks: voyage?.remarks || '',
  })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const url = isEdit ? `/api/voyages/${voyage!.id}` : '/api/voyages'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (data.success) {
        onSuccess()
      } else {
        setError(data.error || 'Failed to save voyage')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8">
      <Card className="w-full max-w-2xl mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-amber-50 dark:bg-amber-950/30">
              <Ship className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-lg">
              {isEdit ? 'Edit Voyage' : 'New Voyage'}
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="size-4" />
          </Button>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isEdit && (
              <div className="space-y-1.5">
                <Label>Voyage Number</Label>
                <Input value={voyage!.voyageNumber} readOnly className="bg-muted" />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Vessel Name *</Label>
                <Input
                  value={form.vesselName}
                  onChange={(e) => handleChange('vesselName', e.target.value)}
                  placeholder="e.g. MSC Fantasia"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sailing Route</Label>
                <Input
                  value={form.sailingRoute}
                  onChange={(e) => handleChange('sailingRoute', e.target.value)}
                  placeholder="e.g. Asia-Europe AE1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Departure Port</Label>
                <Input
                  value={form.departurePort}
                  onChange={(e) => handleChange('departurePort', e.target.value)}
                  placeholder="e.g. Shanghai (CNSHA)"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Arrival Port</Label>
                <Input
                  value={form.arrivalPort}
                  onChange={(e) => handleChange('arrivalPort', e.target.value)}
                  placeholder="e.g. Rotterdam (NLRTM)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>ETD (Estimated Departure)</Label>
                <Input
                  type="date"
                  value={form.etd}
                  onChange={(e) => handleChange('etd', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>ETA (Estimated Arrival)</Label>
                <Input
                  type="date"
                  value={form.eta}
                  onChange={(e) => handleChange('eta', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Shipping Line</Label>
                <Input
                  value={form.shippingLine}
                  onChange={(e) => handleChange('shippingLine', e.target.value)}
                  placeholder="e.g. MSC, Maersk"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => handleChange('status', v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Remarks</Label>
              <Textarea
                value={form.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
                placeholder="Additional notes or remarks..."
                rows={3}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !form.vesselName}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                {isEdit ? 'Update Voyage' : 'Create Voyage'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
