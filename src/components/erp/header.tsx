'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { formatDistanceToNow } from 'date-fns'
import {
  Search,
  Bell,
  Moon,
  Sun,
  ChevronRight,
  LayoutDashboard,
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
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  FolderOpen,
  BarChart3,
  Settings,
  User,
  LogOut,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CheckCheck,
  ExternalLink,
} from 'lucide-react'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useNavigationStore, type PageId } from '@/lib/store'

const pageInfoMap: Record<PageId, { label: string; parent?: string; icon: React.ElementType }> = {
  dashboard: { label: 'Dashboard', icon: LayoutDashboard },
  shipments: { label: 'All Shipments', parent: 'Shipment Operations', icon: Package },
  'shipment-detail': { label: 'Shipment Detail', parent: 'Shipment Operations', icon: Package },
  'container-tracking': { label: 'Container Tracking', parent: 'Shipment Operations', icon: Container },
  'shipment-expenses': { label: 'Shipment Expenses', parent: 'Shipment Operations', icon: Receipt },
  'shipment-revenue': { label: 'Shipment Revenue', parent: 'Shipment Operations', icon: DollarSign },
  'shipment-profitability': { label: 'Shipment Profitability', parent: 'Shipment Operations', icon: TrendingUp },
  'shipment-reports': { label: 'Shipment Reports', parent: 'Shipment Operations', icon: FileBarChart },
  voyage: { label: 'All Voyages', parent: 'Voyage Finance', icon: Ship },
  'voyage-detail': { label: 'Voyage Detail', parent: 'Voyage Finance', icon: Ship },
  'voyage-teu': { label: 'TEU Management', parent: 'Voyage Finance', icon: Box },
  'voyage-revenue': { label: 'Voyage Revenue', parent: 'Voyage Finance', icon: Banknote },
  'voyage-expenses': { label: 'Voyage Expenses', parent: 'Voyage Finance', icon: CreditCard },
  'voyage-profitability': { label: 'Voyage Profitability', parent: 'Voyage Finance', icon: TrendingUp },
  'voyage-reports': { label: 'Voyage Reports', parent: 'Voyage Finance', icon: FileBarChart },
  finance: { label: 'Finance', icon: Wallet },
  'finance-receivable': { label: 'Accounts Receivable', parent: 'Finance', icon: ArrowDownLeft },
  'finance-payable': { label: 'Accounts Payable', parent: 'Finance', icon: ArrowUpRight },
  'finance-invoices': { label: 'Invoices', parent: 'Finance', icon: FileText },
  'finance-payments': { label: 'Payments', parent: 'Finance', icon: Banknote },
  documents: { label: 'Documents', icon: FolderOpen },
  analytics: { label: 'Analytics', icon: BarChart3 },
  settings: { label: 'Settings', icon: Settings },
}

// Notification types
interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  isRead: boolean
  link: string | null
  createdAt: string
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'success': return <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
    case 'warning': return <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
    case 'error': return <XCircle className="size-4 text-red-600 dark:text-red-400 shrink-0" />
    default: return <Info className="size-4 text-sky-600 dark:text-sky-400 shrink-0" />
  }
}

export function ERPHeader() {
  const { currentPage, goBack, navigateTo } = useNavigationStore()
  const { theme, setTheme } = useTheme()

  const pageInfo = pageInfoMap[currentPage] || { label: 'Dashboard', icon: LayoutDashboard }

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setNotifLoading(true)
      const res = await fetch('/api/notifications?limit=10&sortOrder=desc')
      const json = await res.json()
      if (json.success) {
        setNotifications(json.data)
        setUnreadCount(json.data.filter((n: Notification) => !n.isRead).length)
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setNotifLoading(false)
    }
  }, [])

  // Fetch unread count on mount
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Fetch notifications when popover opens
  useEffect(() => {
    if (notifOpen) {
      fetchNotifications()
    }
  }, [notifOpen, fetchNotifications])

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.isRead)
      await Promise.all(
        unreadNotifs.map(n =>
          fetch('/api/notifications', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: n.id, isRead: true }),
          })
        )
      )
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking notifications as read:', err)
    }
  }

  // Mark single as read
  const markAsRead = async (notifId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notifId, isRead: true }),
      })
      setNotifications(prev =>
        prev.map(n => n.id === notifId ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Breadcrumb */}
      <Breadcrumb className="hidden sm:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="cursor-pointer"
              onClick={() => goBack()}
            >
              FreightFlow
            </BreadcrumbLink>
          </BreadcrumbItem>
          {pageInfo.parent && (
            <>
              <BreadcrumbSeparator>
                <ChevronRight className="size-3.5" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink className="text-muted-foreground">
                  {pageInfo.parent}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator>
            <ChevronRight className="size-3.5" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium">
              {pageInfo.label}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Mobile breadcrumb - just show page name */}
      <span className="sm:hidden font-medium text-sm">{pageInfo.label}</span>

      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:flex relative w-64">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search shipments, voyages..."
          className="pl-8 h-9 bg-muted/50 border-0 focus-visible:ring-1"
        />
      </div>

      {/* Notification Bell with Popover */}
      <Popover open={notifOpen} onOpenChange={setNotifOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative size-9">
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 size-4 p-0 flex items-center justify-center bg-emerald-600 text-[10px] text-white border-0">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between p-4 border-b">
            <h4 className="text-sm font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                onClick={markAllAsRead}
              >
                <CheckCheck className="size-3.5 mr-1" />
                Mark all as read
              </Button>
            )}
          </div>
          <ScrollArea className="max-h-80">
            {notifLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="size-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="size-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No notifications</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">You&#39;re all caught up!</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                      !notif.isRead ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                    }`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className="mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm truncate ${!notif.isRead ? 'font-semibold' : 'font-medium'}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="size-2 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 gap-1"
              onClick={() => {
                setNotifOpen(false)
                navigateTo('settings')
              }}
            >
              View All Notifications
              <ExternalLink className="size-3" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Theme Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </TooltipContent>
      </Tooltip>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative size-9 rounded-full">
            <Avatar className="size-8">
              <AvatarFallback className="bg-emerald-700 text-white text-xs">
                JD
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-muted-foreground">john@freightflow.com</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 size-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 size-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <LogOut className="mr-2 size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
