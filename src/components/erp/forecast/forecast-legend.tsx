import React from 'react'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function ForecastLegend() {
  const items = [
    { color: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700', label: 'Updated value' },
    { color: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700', label: 'New row added' },
    { color: 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700', label: 'Removed row' },
  ]

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="font-medium flex items-center gap-1">
        Legend:
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="size-3 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Changes detected since previous version</p>
          </TooltipContent>
        </Tooltip>
      </span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className={`inline-block size-3 rounded border ${item.color}`} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}
