'use client'

import React, { useState, useEffect } from 'react'
import { Ship, Plane, Truck, Loader2, Check, ChevronsUpDown, Plus, Anchor } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'

interface ShipmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shipment?: { id?: string; [key: string]: unknown } | null
  onSuccess?: () => void
}

interface Customer {
  id: string
  name: string
  code: string
}

interface VoyageOption {
  id: string
  voyageNumber: string
  vesselName: string
  status: string
}

const defaultForm = {
  direction: 'import',
  transportMode: 'sea',
  customerId: '',
  voyageId: '',
  shipper: '',
  consignee: '',
  notifyParty: '',
  bookingNumber: '',
  blNumber: '',
  awbNumber: '',
  cargoType: '',
  imoClass: '',
  originCountry: '',
  destinationCountry: '',
  portOfLoading: '',
  portOfDischarge: '',
  finalDestination: '',
  etd: '',
  eta: '',
  vesselName: '',
  voyageNumber: '',
  freeDays: '',
  status: 'draft',
  remarks: '',
}

export function ShipmentForm({ open, onOpenChange, shipment, onSuccess }: ShipmentFormProps) {
  const [form, setForm] = useState(defaultForm)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [voyages, setVoyages] = useState<VoyageOption[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false)
  const [customerSearchValue, setCustomerSearchValue] = useState('')
  const [creatingCustomer, setCreatingCustomer] = useState(false)
  const [voyagePopoverOpen, setVoyagePopoverOpen] = useState(false)

  const isEditing = !!shipment?.id

  useEffect(() => {
    if (open) {
      fetch('/api/customers?limit=100')
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setCustomers(json.data || [])
        })
        .catch(() => {})

      fetch('/api/voyages?limit=100')
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setVoyages(json.data || [])
        })
        .catch(() => {})

      if (shipment && shipment.id) {
        const voyage = (shipment as Record<string, unknown>).voyage as VoyageOption | undefined
        setForm({
          direction: (shipment.direction as string) || 'import',
          transportMode: (shipment.transportMode as string) || 'sea',
          customerId: (shipment.customerId as string) || '',
          voyageId: (shipment.voyageId as string) || (voyage?.id as string) || '',
          shipper: (shipment.shipper as string) || '',
          consignee: (shipment.consignee as string) || '',
          notifyParty: (shipment.notifyParty as string) || '',
          bookingNumber: (shipment.bookingNumber as string) || '',
          blNumber: (shipment.blNumber as string) || '',
          awbNumber: (shipment.awbNumber as string) || '',
          cargoType: (shipment.cargoType as string) || '',
          imoClass: (shipment.imoClass as string) || '',
          originCountry: (shipment.originCountry as string) || '',
          destinationCountry: (shipment.destinationCountry as string) || '',
          portOfLoading: (shipment.portOfLoading as string) || '',
          portOfDischarge: (shipment.portOfDischarge as string) || '',
          finalDestination: (shipment.finalDestination as string) || '',
          etd: shipment.etd
            ? new Date(shipment.etd as string).toISOString().split('T')[0]
            : '',
          eta: shipment.eta
            ? new Date(shipment.eta as string).toISOString().split('T')[0]
            : '',
          vesselName: (shipment.vesselName as string) || '',
          voyageNumber: (shipment.voyageNumber as string) || '',
          freeDays: shipment.freeDays ? String(shipment.freeDays) : '',
          status: (shipment.status as string) || 'draft',
          remarks: (shipment.remarks as string) || '',
        })
      } else {
        setForm(defaultForm)
      }
      setError('')
    }
  }, [open, shipment])

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')

    try {
      const payload = {
        ...form,
        customerId: form.customerId || null,
        voyageId: form.voyageId || null,
        freeDays: form.freeDays ? parseInt(form.freeDays) : null,
        etd: form.etd || null,
        eta: form.eta || null,
      }

      const url = isEditing ? `/api/shipments/${shipment.id}` : '/api/shipments'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (json.success) {
        onSuccess?.()
        onOpenChange(false)
      } else {
        setError(json.error || 'Failed to save shipment')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>
            {isEditing ? 'Edit Shipment' : 'New Shipment'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update shipment information below.'
              : 'Fill in the details to create a new shipment.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-6">
          <div className="space-y-6 pb-6">
            {/* Direction & Transport Mode */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Direction</Label>
              <RadioGroup
                value={form.direction}
                onValueChange={(v) => handleChange('direction', v)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="import" id="import" />
                  <Label htmlFor="import" className="cursor-pointer flex items-center gap-1.5">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                      Import
                    </Badge>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="export" id="export" />
                  <Label htmlFor="export" className="cursor-pointer flex items-center gap-1.5">
                    <Badge variant="secondary" className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400">
                      Export
                    </Badge>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Transport Mode</Label>
              <RadioGroup
                value={form.transportMode}
                onValueChange={(v) => handleChange('transportMode', v)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sea" id="sea" />
                  <Label htmlFor="sea" className="cursor-pointer flex items-center gap-1.5">
                    <Ship className="size-4" /> Sea
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="air" id="air" />
                  <Label htmlFor="air" className="cursor-pointer flex items-center gap-1.5">
                    <Plane className="size-4" /> Air
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="land" id="land" />
                  <Label htmlFor="land" className="cursor-pointer flex items-center gap-1.5">
                    <Truck className="size-4" /> Land
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Customer & Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Popover open={customerPopoverOpen} onOpenChange={(open) => {
                  setCustomerPopoverOpen(open)
                  if (open) setCustomerSearchValue('')
                }}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerPopoverOpen}
                      className="w-full justify-between font-normal"
                    >
                      {form.customerId
                        ? customers.find((c) => c.id === form.customerId)?.name || 'Select customer'
                        : 'Select customer'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search customers..."
                        value={customerSearchValue}
                        onValueChange={setCustomerSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {customerSearchValue ? (
                            <Button
                              variant="ghost"
                              className="w-full justify-start gap-2"
                              onClick={async () => {
                                setCreatingCustomer(true)
                                try {
                                  const res = await fetch('/api/customers', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ name: customerSearchValue }),
                                  })
                                  const json = await res.json()
                                  if (json.success) {
                                    setCustomers((prev) => [...prev, json.data])
                                    handleChange('customerId', json.data.id)
                                    setCustomerPopoverOpen(false)
                                    setCustomerSearchValue('')
                                  } else {
                                    setError(json.error || 'Failed to create customer')
                                  }
                                } catch {
                                  setError('Network error. Please try again.')
                                } finally {
                                  setCreatingCustomer(false)
                                }
                              }}
                              disabled={creatingCustomer}
                            >
                              {creatingCustomer ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Plus className="size-4" />
                              )}
                              Create &quot;{customerSearchValue}&quot;
                            </Button>
                          ) : (
                            'No customers found.'
                          )}
                        </CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="_none"
                            onSelect={() => {
                              handleChange('customerId', '')
                              setCustomerPopoverOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                !form.customerId ? "opacity-100" : "opacity-0"
                              )}
                            />
                            No Customer
                          </CommandItem>
                          {customers.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={`${c.name} ${c.code}`}
                              onSelect={() => {
                                handleChange('customerId', c.id)
                                setCustomerPopoverOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.customerId === c.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {c.name} ({c.code})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => handleChange('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="loading">Loading</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="arrived">Arrived</SelectItem>
                    <SelectItem value="customs_clearance">Customs Clearance</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Shipper</Label>
                <Input
                  value={form.shipper}
                  onChange={(e) => handleChange('shipper', e.target.value)}
                  placeholder="Shipper name"
                />
              </div>
              <div className="space-y-2">
                <Label>Consignee</Label>
                <Input
                  value={form.consignee}
                  onChange={(e) => handleChange('consignee', e.target.value)}
                  placeholder="Consignee name"
                />
              </div>
              <div className="space-y-2">
                <Label>Notify Party</Label>
                <Input
                  value={form.notifyParty}
                  onChange={(e) => handleChange('notifyParty', e.target.value)}
                  placeholder="Notify party"
                />
              </div>
            </div>

            <Separator />

            {/* Reference Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Booking Number</Label>
                <Input
                  value={form.bookingNumber}
                  onChange={(e) => handleChange('bookingNumber', e.target.value)}
                  placeholder="Booking ref"
                />
              </div>
              <div className="space-y-2">
                <Label>BL Number</Label>
                <Input
                  value={form.blNumber}
                  onChange={(e) => handleChange('blNumber', e.target.value)}
                  placeholder="Bill of Lading"
                />
              </div>
              {form.transportMode === 'air' && (
                <div className="space-y-2">
                  <Label>AWB Number</Label>
                  <Input
                    value={form.awbNumber}
                    onChange={(e) => handleChange('awbNumber', e.target.value)}
                    placeholder="Air Waybill"
                  />
                </div>
              )}
            </div>

            {/* Cargo Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cargo Type</Label>
                <Select value={form.cargoType} onValueChange={(v) => handleChange('cargoType', v === '_none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cargo type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="hazardous">Hazardous</SelectItem>
                    <SelectItem value="perishable">Perishable</SelectItem>
                    <SelectItem value="oversized">Oversized</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>IMO Class</Label>
                <Select value={form.imoClass} onValueChange={(v) => handleChange('imoClass', v === '_none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select IMO class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    <SelectItem value="IMO">IMO</SelectItem>
                    <SelectItem value="NON-IMO">NON-IMO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Route */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origin Country</Label>
                <Input
                  value={form.originCountry}
                  onChange={(e) => handleChange('originCountry', e.target.value)}
                  placeholder="Country of origin"
                />
              </div>
              <div className="space-y-2">
                <Label>Destination Country</Label>
                <Input
                  value={form.destinationCountry}
                  onChange={(e) => handleChange('destinationCountry', e.target.value)}
                  placeholder="Destination country"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Port of Loading</Label>
                <Input
                  value={form.portOfLoading}
                  onChange={(e) => handleChange('portOfLoading', e.target.value)}
                  placeholder="POL"
                />
              </div>
              <div className="space-y-2">
                <Label>Port of Discharge</Label>
                <Input
                  value={form.portOfDischarge}
                  onChange={(e) => handleChange('portOfDischarge', e.target.value)}
                  placeholder="POD"
                />
              </div>
              <div className="space-y-2">
                <Label>Final Destination</Label>
                <Input
                  value={form.finalDestination}
                  onChange={(e) => handleChange('finalDestination', e.target.value)}
                  placeholder="Final destination"
                />
              </div>
            </div>

            <Separator />

            {/* Dates & Vessel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ETD (Estimated Departure)</Label>
                <Input
                  type="date"
                  value={form.etd}
                  onChange={(e) => handleChange('etd', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>ETA (Estimated Arrival)</Label>
                <Input
                  type="date"
                  value={form.eta}
                  onChange={(e) => handleChange('eta', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Linked Voyage</Label>
              <Popover open={voyagePopoverOpen} onOpenChange={(open) => {
                setVoyagePopoverOpen(open)
              }}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={voyagePopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    {form.voyageId
                      ? voyages.find((v) => v.id === form.voyageId)?.voyageNumber || 'Select voyage'
                      : 'Select voyage'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Search voyages..." />
                    <CommandList>
                      <CommandEmpty>No voyages found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="_none"
                          onSelect={() => {
                            handleChange('voyageId', '')
                            setVoyagePopoverOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !form.voyageId ? "opacity-100" : "opacity-0"
                            )}
                          />
                          No Voyage
                        </CommandItem>
                        {voyages.map((v) => (
                          <CommandItem
                            key={v.id}
                            value={`${v.voyageNumber} ${v.vesselName}`}
                            onSelect={() => {
                              handleChange('voyageId', v.id)
                              handleChange('vesselName', v.vesselName)
                              handleChange('voyageNumber', v.voyageNumber)
                              setVoyagePopoverOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                form.voyageId === v.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex items-center gap-2">
                              <Anchor className="size-3.5 text-muted-foreground" />
                              <span className="font-medium">{v.voyageNumber}</span>
                              <span className="text-muted-foreground">- {v.vesselName}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Vessel Name</Label>
                <Input
                  value={form.vesselName}
                  onChange={(e) => handleChange('vesselName', e.target.value)}
                  placeholder="Vessel name"
                />
              </div>
              <div className="space-y-2">
                <Label>Voyage Number</Label>
                <Input
                  value={form.voyageNumber}
                  onChange={(e) => handleChange('voyageNumber', e.target.value)}
                  placeholder="Voyage number"
                />
              </div>
              <div className="space-y-2">
                <Label>Free Days</Label>
                <Input
                  type="number"
                  value={form.freeDays}
                  onChange={(e) => handleChange('freeDays', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <Separator />

            {/* Remarks */}
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={form.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
                placeholder="Additional notes or remarks..."
                rows={3}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                {isEditing ? 'Update Shipment' : 'Create Shipment'}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
