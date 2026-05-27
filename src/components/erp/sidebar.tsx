'use client'

import React, { useState } from 'react'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
  Ship,
  Package,
  Container,
  Receipt,
  DollarSign,
  TrendingUp,
  FileBarChart,
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
  ChevronDown,
  LogOut,
  User,
  Moon,
  Sun,
  Globe,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNavigationStore, type PageId } from '@/lib/store'

interface NavItem {
  id: PageId
  label: string
  icon: React.ElementType
}

interface NavSection {
  id: string
  label: string
  icon: React.ElementType
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    id: 'shipment-ops',
    label: 'Shipment Operations',
    icon: Ship,
    items: [
      { id: 'shipments', label: 'All Shipments', icon: Package },
      { id: 'container-tracking', label: 'Container Tracking', icon: Container },
      { id: 'shipment-expenses', label: 'Shipment Expenses', icon: Receipt },
      { id: 'shipment-revenue', label: 'Shipment Revenue', icon: DollarSign },
      { id: 'shipment-profitability', label: 'Shipment Profitability', icon: TrendingUp },
      { id: 'shipment-reports', label: 'Shipment Reports', icon: FileBarChart },
    ],
  },
  {
    id: 'voyage-finance',
    label: 'Voyage Finance',
    icon: Anchor,
    items: [
      { id: 'voyage', label: 'All Voyages', icon: Ship },
      { id: 'voyage-teu', label: 'TEU Management', icon: Box },
      { id: 'voyage-revenue', label: 'Voyage Revenue', icon: Banknote },
      { id: 'voyage-expenses', label: 'Voyage Expenses', icon: CreditCard },
      { id: 'voyage-profitability', label: 'Voyage Profitability', icon: TrendingUp },
      { id: 'voyage-reports', label: 'Voyage Reports', icon: FileBarChart },
    ],
  },
]

const financeItems: NavItem[] = [
  { id: 'finance-receivable', label: 'Accounts Receivable', icon: ArrowDownLeft },
  { id: 'finance-payable', label: 'Accounts Payable', icon: ArrowUpRight },
  { id: 'finance-invoices', label: 'Invoices', icon: FileText },
  { id: 'finance-payments', label: 'Payments', icon: Banknote },
]

export function ERPSidebar() {
  const { currentPage, navigateTo } = useNavigationStore()
  const { theme, setTheme } = useTheme()
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'shipment-ops': true,
    'voyage-finance': true,
  })

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const isActive = (pageId: PageId) => currentPage === pageId

  const isSectionActive = (section: NavSection) =>
    section.items.some((item) => isActive(item.id))

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-sidebar-accent"
              onClick={() => navigateTo('dashboard')}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Globe className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-emerald-400">FreightFlow</span>
                <span className="truncate text-xs text-sidebar-foreground/60">ERP System</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="custom-scrollbar">
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('dashboard')}
                  onClick={() => navigateTo('dashboard')}
                  tooltip="Dashboard"
                >
                  <LayoutDashboard className="size-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Collapsible Sections */}
        {navSections.map((section) => (
          <SidebarGroup key={section.id}>
            <SidebarGroupLabel
              className="cursor-pointer select-none hover:text-sidebar-foreground"
              onClick={() => toggleSection(section.id)}
            >
              <section.icon className="size-4 mr-1" />
              <span className="flex-1">{section.label}</span>
              <ChevronDown
                className={`size-3 transition-transform ${
                  openSections[section.id] ? 'rotate-180' : ''
                }`}
              />
            </SidebarGroupLabel>
            {openSections[section.id] && (
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={isActive(item.id)}
                        onClick={() => navigateTo(item.id)}
                        tooltip={item.label}
                        className="pl-6"
                      >
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        ))}

        {/* Finance */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <Wallet className="size-4 mr-1" />
            Finance
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={isActive(item.id)}
                    onClick={() => navigateTo(item.id)}
                    tooltip={item.label}
                    className="pl-6"
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Documents, Analytics, Settings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('documents')}
                  onClick={() => navigateTo('documents')}
                  tooltip="Documents"
                >
                  <FolderOpen className="size-4" />
                  <span>Documents</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('analytics')}
                  onClick={() => navigateTo('analytics')}
                  tooltip="Analytics"
                >
                  <BarChart3 className="size-4" />
                  <span>Analytics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive('settings')}
                  onClick={() => navigateTo('settings')}
                  tooltip="Settings"
                >
                  <Settings className="size-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="hover:bg-sidebar-accent">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-emerald-700 text-white text-xs">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">John Doe</span>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      Operations Manager
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-dropdown-menu-trigger-width]"
              >
                <DropdownMenuItem onClick={() => navigateTo('settings')}>
                  <User className="mr-2 size-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? (
                    <Sun className="mr-2 size-4" />
                  ) : (
                    <Moon className="mr-2 size-4" />
                  )}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
