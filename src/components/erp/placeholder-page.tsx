'use client'

import React from 'react'
import {
  Package,
  Container,
  Receipt,
  DollarSign,
  TrendingUp,
  FileBarChart,
  Ship,
  Anchor,
  Box,
  Banknote,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  FolderOpen,
  BarChart3,
  Settings,
  Construction,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useNavigationStore, type PageId } from '@/lib/store'

interface PlaceholderPageProps {
  title: string
  description: string
  icon: React.ElementType
  accentColor?: string
}

function PlaceholderPage({ title, description, icon: Icon, accentColor = 'emerald' }: PlaceholderPageProps) {
  const { navigateTo } = useNavigationStore()

  const colorMap: Record<string, { icon: string; bg: string; border: string; badge: string }> = {
    emerald: {
      icon: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
    },
    teal: {
      icon: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-950/30',
      border: 'border-teal-200 dark:border-teal-800',
      badge: 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400',
    },
    amber: {
      icon: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
    },
  }

  const colors = colorMap[accentColor] || colorMap.emerald

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`rounded-xl p-3 ${colors.bg}`}>
          <Icon className={`size-6 ${colors.icon}`} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Badge className={`ml-auto ${colors.badge}`}>
          <Construction className="size-3 mr-1" />
          Coming Soon
        </Badge>
      </div>

      <Separator />

      {/* Placeholder Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Data Table</CardTitle>
              <CardDescription>Records will appear here</CardDescription>
            </div>
            <Button variant="outline" size="sm" className={colors.border}>
              <Package className="size-4 mr-2" />
              Add New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Table header */}
            <div className="grid grid-cols-5 gap-4 pb-2 border-b">
              {['Reference', 'Status', 'Date', 'Amount', 'Actions'].map((h) => (
                <span key={h} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {h}
                </span>
              ))}
            </div>
            {/* Table rows */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-4 py-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Map each PageId to its placeholder configuration
const pageConfigMap: Record<PageId, {
  title: string
  description: string
  icon: React.ElementType
  accentColor?: string
}> = {
  dashboard: { title: '', description: '', icon: Package }, // handled separately
  shipments: {
    title: 'All Shipments',
    description: 'Manage and track all your freight shipments across the supply chain.',
    icon: Package,
  },
  'shipment-detail': {
    title: 'Shipment Detail',
    description: 'View and manage details for this shipment.',
    icon: Package,
  },
  'container-tracking': {
    title: 'Container Tracking',
    description: 'Real-time tracking and status monitoring for all containers.',
    icon: Container,
  },
  'shipment-expenses': {
    title: 'Shipment Expenses',
    description: 'Track and manage all expenses associated with shipments.',
    icon: Receipt,
    accentColor: 'amber',
  },
  'shipment-revenue': {
    title: 'Shipment Revenue',
    description: 'Monitor revenue streams from shipment operations.',
    icon: DollarSign,
  },
  'shipment-profitability': {
    title: 'Shipment Profitability',
    description: 'Analyze profit margins and financial performance of shipments.',
    icon: TrendingUp,
  },
  'shipment-reports': {
    title: 'Shipment Reports',
    description: 'Generate and view comprehensive shipment operation reports.',
    icon: FileBarChart,
  },
  voyage: {
    title: 'All Voyages',
    description: 'Manage and monitor all vessel voyages and schedules.',
    icon: Ship,
    accentColor: 'teal',
  },
  'voyage-detail': {
    title: 'Voyage Detail',
    description: 'View and manage details for this voyage.',
    icon: Ship,
    accentColor: 'teal',
  },
  'voyage-teu': {
    title: 'TEU Management',
    description: 'Track and manage TEU allocation and utilization across voyages.',
    icon: Box,
    accentColor: 'teal',
  },
  'voyage-revenue': {
    title: 'Voyage Revenue',
    description: 'Monitor and analyze revenue from voyage operations.',
    icon: Banknote,
    accentColor: 'teal',
  },
  'voyage-expenses': {
    title: 'Voyage Expenses',
    description: 'Track and control expenses for voyage operations.',
    icon: CreditCard,
    accentColor: 'teal',
  },
  'voyage-profitability': {
    title: 'Voyage Profitability',
    description: 'Analyze financial performance and profitability of voyages.',
    icon: TrendingUp,
    accentColor: 'teal',
  },
  'voyage-reports': {
    title: 'Voyage Reports',
    description: 'Generate comprehensive voyage performance and financial reports.',
    icon: FileBarChart,
    accentColor: 'teal',
  },
  finance: {
    title: 'Finance Overview',
    description: 'Complete financial management for your logistics operations.',
    icon: Banknote,
  },
  'finance-receivable': {
    title: 'Accounts Receivable',
    description: 'Track incoming payments and manage customer receivables.',
    icon: ArrowDownLeft,
    accentColor: 'amber',
  },
  'finance-payable': {
    title: 'Accounts Payable',
    description: 'Manage vendor payments and outstanding payables.',
    icon: ArrowUpRight,
    accentColor: 'amber',
  },
  'finance-invoices': {
    title: 'Invoices',
    description: 'Create, send, and manage invoices for shipments and voyages.',
    icon: FileText,
  },
  'finance-payments': {
    title: 'Payments',
    description: 'Process and track all incoming and outgoing payments.',
    icon: Banknote,
  },
  documents: {
    title: 'Documents',
    description: 'Manage and organize all shipping and logistics documents.',
    icon: FolderOpen,
  },
  analytics: {
    title: 'Analytics',
    description: 'Business intelligence and data analytics for logistics operations.',
    icon: BarChart3,
  },
  settings: {
    title: 'Settings',
    description: 'Configure system settings, users, and preferences.',
    icon: Settings,
  },
}

export { PlaceholderPage, pageConfigMap }
