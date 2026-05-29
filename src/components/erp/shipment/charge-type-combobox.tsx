'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

interface ChargeType {
  id: string
  type: string
  value: string
  label: string
}

interface ChargeTypeComboboxProps {
  type: 'expense' | 'revenue'
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export function ChargeTypeCombobox({ type, value, onValueChange, placeholder }: ChargeTypeComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<ChargeType[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (open && !fetchedRef.current) {
      fetchedRef.current = true
      setLoading(true)
      fetch(`/api/charge-types?type=${type}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setItems(json.data)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
    if (!open) {
      setSearch('')
    }
  }, [open, type])

  const selected = items.find((i) => i.value === value)

  const handleCreate = async () => {
    if (!search.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/charge-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value: search.trim().toLowerCase().replace(/\s+/g, '_'), label: search.trim().toUpperCase() }),
      })
      const json = await res.json()
      if (json.success) {
        setItems((prev) => [...prev, json.data])
        onValueChange(json.data.value)
        setOpen(false)
        setSearch('')
      }
    } catch (err) {
      console.error('Failed to create charge type:', err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? selected.label : (placeholder || `Select ${type} type...`)}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput
            placeholder="Search or type new..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-4 animate-spin" />
                </div>
              ) : search.trim() ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  Create &quot;{search.trim().toUpperCase()}&quot;
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground py-6 block text-center">
                  No types found.
                </span>
              )}
            </CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${item.value}`}
                  onSelect={() => {
                    onValueChange(item.value)
                    setOpen(false)
                    setSearch('')
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === item.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
