'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Settings, Building2, Coins, ArrowLeftRight, Users, Bell, FileText,
  Plus, Save, Loader2, RefreshCw, Search, Shield, Eye, Edit,
  Truck, Calculator, Database, CheckCircle2, XCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts'
import { format, parseISO } from 'date-fns'

// ── Types ──
interface CompanyProfile {
  id: string
  name: string
  legalName: string | null
  taxId: string | null
  address: string | null
  city: string | null
  country: string | null
  phone: string | null
  email: string | null
  website: string | null
  logo: string | null
  baseCurrency: string
}

interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  isActive: boolean
  createdAt: string
}

interface ExchangeRate {
  id: string
  fromCurrency: string
  toCurrency: string
  rate: number
  date: string
  source: string | null
  createdAt: string
}

interface AuditLog {
  id: string
  userId: string | null
  user: { id: string; name: string; email: string } | null
  action: string
  entity: string
  entityId: string | null
  details: string | null
  ipAddress: string | null
  createdAt: string
}

const currencyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 })

const ROLES = [
  { name: 'Super Admin', icon: Shield, color: 'text-red-600', desc: 'Full system access with all permissions. Can manage users, settings, and all modules.' },
  { name: 'Admin', icon: Shield, color: 'text-orange-600', desc: 'Administrative access to most features. Can manage users and configure modules.' },
  { name: 'Accountant', icon: Calculator, color: 'text-emerald-600', desc: 'Access to financial data, invoices, payments, and accounting reports.' },
  { name: 'Operations', icon: Truck, color: 'text-teal-600', desc: 'Shipment and voyage management, container tracking, and logistics operations.' },
  { name: 'Finance Manager', icon: Calculator, color: 'text-amber-600', desc: 'Financial oversight, budgeting, profitability analysis, and financial reports.' },
  { name: 'Data Entry', icon: Edit, color: 'text-cyan-600', desc: 'Create and edit shipments, voyages, expenses, and revenue entries.' },
  { name: 'Viewer', icon: Eye, color: 'text-gray-600', desc: 'Read-only access to dashboards, reports, and data views.' },
]

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700',
  UPDATE: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-teal-100 text-teal-700',
  EXPORT: 'bg-cyan-100 text-cyan-700',
}

// ── Component ──
export function SettingsPage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Dialog states
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false)
  const [showRateDialog, setShowRateDialog] = useState(false)

  // Form states
  const [profileForm, setProfileForm] = useState<Partial<CompanyProfile>>({})
  const [newCurrency, setNewCurrency] = useState({ code: '', name: '', symbol: '', isActive: true })
  const [newRate, setNewRate] = useState({ fromCurrency: '', toCurrency: '', rate: '', date: '', source: '' })

  // Notification states
  const [notifications, setNotifications] = useState({
    email: true, shipmentAlerts: true, paymentReminders: true, delayedAlerts: true,
  })

  // Audit log filters
  const [logFilters, setLogFilters] = useState({ action: '', entity: '', startDate: '', endDate: '' })

  // Exchange rate chart
  const [rateChartPair, setRateChartPair] = useState({ from: '', to: '' })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [profRes, curRes, rateRes, logRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/currencies'),
        fetch('/api/exchange-rates?limit=100'),
        fetch('/api/audit-logs?limit=100'),
      ])
      const [profJson, curJson, rateJson, logJson] = await Promise.all([
        profRes.json(), curRes.json(), rateRes.json(), logRes.json(),
      ])
      if (profJson.data) {
        setProfile(profJson.data)
        setProfileForm(profJson.data)
      }
      setCurrencies(curJson.data || [])
      setExchangeRates(rateJson.data || [])
      setAuditLogs(logJson.data || [])
    } catch (err) {
      console.error('Error loading settings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Save company profile
  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setSaveSuccess(false)
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      })
      const json = await res.json()
      if (json.success) {
        setProfile(json.data)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Error saving profile:', err)
    } finally {
      setSaving(false)
    }
  }

  // Add currency
  const handleAddCurrency = async () => {
    try {
      const res = await fetch('/api/currencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCurrency),
      })
      const json = await res.json()
      if (json.success) {
        setCurrencies(prev => [...prev, json.data])
        setShowCurrencyDialog(false)
        setNewCurrency({ code: '', name: '', symbol: '', isActive: true })
      }
    } catch (err) {
      console.error('Error adding currency:', err)
    }
  }

  // Add exchange rate
  const handleAddRate = async () => {
    try {
      const res = await fetch('/api/exchange-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRate,
          rate: parseFloat(newRate.rate),
        }),
      })
      const json = await res.json()
      if (json.success) {
        setExchangeRates(prev => [json.data, ...prev])
        setShowRateDialog(false)
        setNewRate({ fromCurrency: '', toCurrency: '', rate: '', date: '', source: '' })
      }
    } catch (err) {
      console.error('Error adding rate:', err)
    }
  }

  // Load filtered audit logs
  const loadFilteredLogs = async () => {
    try {
      const params = new URLSearchParams()
      if (logFilters.action) params.set('action', logFilters.action)
      if (logFilters.entity) params.set('entity', logFilters.entity)
      if (logFilters.startDate) params.set('startDate', logFilters.startDate)
      if (logFilters.endDate) params.set('endDate', logFilters.endDate)
      params.set('limit', '100')
      const res = await fetch(`/api/audit-logs?${params.toString()}`)
      const json = await res.json()
      if (json.success) setAuditLogs(json.data || [])
    } catch (err) {
      console.error('Error filtering logs:', err)
    }
  }

  // Exchange rate chart data
  const rateChartData = useMemo(() => {
    if (!rateChartPair.from || !rateChartPair.to) return []
    return exchangeRates
      .filter(r => r.fromCurrency === rateChartPair.from && r.toCurrency === rateChartPair.to)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(r => ({ date: format(parseISO(r.date), 'MMM dd'), rate: r.rate }))
  }, [exchangeRates, rateChartPair])

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="rounded-xl p-3 bg-emerald-50 dark:bg-emerald-950/30">
          <Settings className="size-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure system settings, users, and preferences</p>
        </div>
      </div>

      <Separator />

      {/* Settings Tabs */}
      <Tabs defaultValue="company" className="space-y-4">
        <ScrollArea className="w-full">
          <TabsList className="grid w-max grid-cols-6">
            <TabsTrigger value="company" className="text-xs sm:text-sm"><Building2 className="size-4 mr-1" />Company</TabsTrigger>
            <TabsTrigger value="currencies" className="text-xs sm:text-sm"><Coins className="size-4 mr-1" />Currencies</TabsTrigger>
            <TabsTrigger value="rates" className="text-xs sm:text-sm"><ArrowLeftRight className="size-4 mr-1" />Rates</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm"><Users className="size-4 mr-1" />Users</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs sm:text-sm"><Bell className="size-4 mr-1" />Notifications</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs sm:text-sm"><FileText className="size-4 mr-1" />Audit</TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* ═══ Company Profile ═══ */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Company Profile</CardTitle>
                  <CardDescription>Manage your organization&apos;s information and branding</CardDescription>
                </div>
                <Button onClick={handleSaveProfile} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                  {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
              {saveSuccess && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm mt-2">
                  <CheckCircle2 className="size-4" />
                  Changes saved successfully
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload Placeholder */}
              <div className="flex items-center gap-6">
                <div className="rounded-xl border-2 border-dashed border-muted-foreground/25 w-24 h-24 flex items-center justify-center bg-muted/50">
                  {profileForm.logo ? (
                    <img src={profileForm.logo} alt="Logo" className="w-20 h-20 object-contain rounded-lg" />
                  ) : (
                    <Building2 className="size-8 text-muted-foreground/50" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Company Logo</p>
                  <p className="text-sm text-muted-foreground mb-2">Upload a logo for your organization</p>
                  <Button variant="outline" size="sm" disabled>
                    <Plus className="size-4 mr-1" /> Upload Logo
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input id="name" value={profileForm.name || ''} onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal Name</Label>
                  <Input id="legalName" value={profileForm.legalName || ''} onChange={e => setProfileForm(prev => ({ ...prev, legalName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / Registration Number</Label>
                  <Input id="taxId" value={profileForm.taxId || ''} onChange={e => setProfileForm(prev => ({ ...prev, taxId: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseCurrency">Base Currency</Label>
                  <Select value={profileForm.baseCurrency || 'USD'} onValueChange={v => setProfileForm(prev => ({ ...prev, baseCurrency: v }))}>
                    <SelectTrigger id="baseCurrency"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currencies.filter(c => c.isActive).map(c => (
                        <SelectItem key={c.id} value={c.code}>{c.code} - {c.name} ({c.symbol})</SelectItem>
                      ))}
                      {currencies.filter(c => c.isActive).length === 0 && (
                        <>
                          <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                          <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Address & Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={profileForm.address || ''} onChange={e => setProfileForm(prev => ({ ...prev, address: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={profileForm.city || ''} onChange={e => setProfileForm(prev => ({ ...prev, city: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={profileForm.country || ''} onChange={e => setProfileForm(prev => ({ ...prev, country: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={profileForm.phone || ''} onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profileForm.email || ''} onChange={e => setProfileForm(prev => ({ ...prev, email: e.target.value }))} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" value={profileForm.website || ''} onChange={e => setProfileForm(prev => ({ ...prev, website: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Currencies ═══ */}
        <TabsContent value="currencies" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Currencies</CardTitle>
                  <CardDescription>Manage supported currencies for your logistics operations</CardDescription>
                </div>
                <Button onClick={() => setShowCurrencyDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="size-4 mr-2" /> Add Currency
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currencies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-bold">{c.code}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.symbol}</TableCell>
                      <TableCell>
                        <Badge variant={c.isActive ? 'default' : 'secondary'}
                          className={c.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {currencies.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No currencies configured. Add your first currency.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Add Currency Dialog */}
          <Dialog open={showCurrencyDialog} onOpenChange={setShowCurrencyDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Currency</DialogTitle>
                <DialogDescription>Add a new currency to the system</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Currency Code *</Label>
                  <Input placeholder="USD" value={newCurrency.code} onChange={e => setNewCurrency(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} maxLength={3} />
                </div>
                <div className="space-y-2">
                  <Label>Currency Name *</Label>
                  <Input placeholder="US Dollar" value={newCurrency.name} onChange={e => setNewCurrency(prev => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Symbol *</Label>
                  <Input placeholder="$" value={newCurrency.symbol} onChange={e => setNewCurrency(prev => ({ ...prev, symbol: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={newCurrency.isActive} onCheckedChange={v => setNewCurrency(prev => ({ ...prev, isActive: v }))} />
                  <Label>Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCurrencyDialog(false)}>Cancel</Button>
                <Button onClick={handleAddCurrency} disabled={!newCurrency.code || !newCurrency.name || !newCurrency.symbol}
                  className="bg-emerald-600 hover:bg-emerald-700">
                  Add Currency
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══ Exchange Rates ═══ */}
        <TabsContent value="rates" className="space-y-4">
          {/* Rate Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Exchange Rate History</CardTitle>
                  <CardDescription>View historical rates for a currency pair</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={rateChartPair.from} onValueChange={v => setRateChartPair(prev => ({ ...prev, from: v }))}>
                    <SelectTrigger className="w-24"><SelectValue placeholder="From" /></SelectTrigger>
                    <SelectContent>
                      {currencies.filter(c => c.isActive).map(c => (
                        <SelectItem key={c.id} value={c.code}>{c.code}</SelectItem>
                      ))}
                      {currencies.filter(c => c.isActive).length === 0 && (
                        <>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <ArrowLeftRight className="size-4 text-muted-foreground" />
                  <Select value={rateChartPair.to} onValueChange={v => setRateChartPair(prev => ({ ...prev, to: v }))}>
                    <SelectTrigger className="w-24"><SelectValue placeholder="To" /></SelectTrigger>
                    <SelectContent>
                      {currencies.filter(c => c.isActive).map(c => (
                        <SelectItem key={c.id} value={c.code}>{c.code}</SelectItem>
                      ))}
                      {currencies.filter(c => c.isActive).length === 0 && (
                        <>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {rateChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={rateChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rate" name="Rate" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  <div className="text-center">
                    <ArrowLeftRight className="size-8 mx-auto mb-2 opacity-50" />
                    <p>Select a currency pair above to view rate history</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Exchange Rate Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Exchange Rates</CardTitle>
                  <CardDescription>Current and historical exchange rates</CardDescription>
                </div>
                <Button onClick={() => setShowRateDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="size-4 mr-2" /> Add Rate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exchangeRates.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono font-bold">{r.fromCurrency}</TableCell>
                        <TableCell className="font-mono font-bold">{r.toCurrency}</TableCell>
                        <TableCell className="text-right font-medium">{r.rate.toFixed(4)}</TableCell>
                        <TableCell>{format(parseISO(r.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{r.source || 'Manual'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {exchangeRates.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No exchange rates configured</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Add Rate Dialog */}
          <Dialog open={showRateDialog} onOpenChange={setShowRateDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Exchange Rate</DialogTitle>
                <DialogDescription>Set a new exchange rate between currencies</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Currency *</Label>
                    <Select value={newRate.fromCurrency} onValueChange={v => setNewRate(prev => ({ ...prev, fromCurrency: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {currencies.filter(c => c.isActive).map(c => (
                          <SelectItem key={c.id} value={c.code}>{c.code}</SelectItem>
                        ))}
                        {currencies.filter(c => c.isActive).length === 0 && (
                          <>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>To Currency *</Label>
                    <Select value={newRate.toCurrency} onValueChange={v => setNewRate(prev => ({ ...prev, toCurrency: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {currencies.filter(c => c.isActive).map(c => (
                          <SelectItem key={c.id} value={c.code}>{c.code}</SelectItem>
                        ))}
                        {currencies.filter(c => c.isActive).length === 0 && (
                          <>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Rate *</Label>
                  <Input type="number" step="0.0001" placeholder="1.0000" value={newRate.rate} onChange={e => setNewRate(prev => ({ ...prev, rate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" value={newRate.date} onChange={e => setNewRate(prev => ({ ...prev, date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Input placeholder="e.g., Manual, API" value={newRate.source} onChange={e => setNewRate(prev => ({ ...prev, source: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRateDialog(false)}>Cancel</Button>
                <Button onClick={handleAddRate} disabled={!newRate.fromCurrency || !newRate.toCurrency || !newRate.rate || !newRate.date}
                  className="bg-emerald-600 hover:bg-emerald-700">
                  Add Rate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══ Users & Roles ═══ */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* User List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Users</CardTitle>
                      <CardDescription>Manage system users and their access</CardDescription>
                    </div>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" disabled>
                      <Plus className="size-4 mr-2" /> Add User
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">System Administrator</TableCell>
                        <TableCell>admin@freightflow.com</TableCell>
                        <TableCell>
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                            <Shield className="size-3 mr-1" />Super Admin
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">Just now</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-muted-foreground">No other users</TableCell>
                        <TableCell className="text-muted-foreground">—</TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>—</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Roles Sidebar */}
            <Card>
              <CardHeader>
                <CardTitle>Roles & Permissions</CardTitle>
                <CardDescription>Available system roles</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-96">
                  <div className="space-y-3">
                    {ROLES.map((role) => {
                      const Icon = role.icon
                      return (
                        <div key={role.name} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={`size-4 ${role.color}`} />
                            <span className="font-medium text-sm">{role.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{role.desc}</p>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ Notifications ═══ */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={v => setNotifications(prev => ({ ...prev, email: v }))}
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div className="space-y-0.5">
                  <Label className="text-base">Shipment Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified about shipment status changes</p>
                </div>
                <Switch
                  checked={notifications.shipmentAlerts}
                  onCheckedChange={v => setNotifications(prev => ({ ...prev, shipmentAlerts: v }))}
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div className="space-y-0.5">
                  <Label className="text-base">Payment Reminders</Label>
                  <p className="text-sm text-muted-foreground">Reminders for pending and overdue payments</p>
                </div>
                <Switch
                  checked={notifications.paymentReminders}
                  onCheckedChange={v => setNotifications(prev => ({ ...prev, paymentReminders: v }))}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <Label className="text-base">Delayed Shipment Alerts</Label>
                  <p className="text-sm text-muted-foreground">Alerts when shipments are delayed past ETA</p>
                </div>
                <Switch
                  checked={notifications.delayedAlerts}
                  onCheckedChange={v => setNotifications(prev => ({ ...prev, delayedAlerts: v }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Audit Logs ═══ */}
        <TabsContent value="audit" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>Track all system activities and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <Select value={logFilters.action} onValueChange={v => setLogFilters(prev => ({ ...prev, action: v }))}>
                  <SelectTrigger><SelectValue placeholder="All Actions" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Actions</SelectItem>
                    <SelectItem value="CREATE">Create</SelectItem>
                    <SelectItem value="UPDATE">Update</SelectItem>
                    <SelectItem value="DELETE">Delete</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                    <SelectItem value="EXPORT">Export</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={logFilters.entity} onValueChange={v => setLogFilters(prev => ({ ...prev, entity: v }))}>
                  <SelectTrigger><SelectValue placeholder="All Entities" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Entities</SelectItem>
                    <SelectItem value="shipment">Shipment</SelectItem>
                    <SelectItem value="voyage">Voyage</SelectItem>
                    <SelectItem value="container">Container</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="date" value={logFilters.startDate} onChange={e => setLogFilters(prev => ({ ...prev, startDate: e.target.value }))} placeholder="Start Date" />
                <Input type="date" value={logFilters.endDate} onChange={e => setLogFilters(prev => ({ ...prev, endDate: e.target.value }))} placeholder="End Date" />
                <Button onClick={loadFilteredLogs} variant="outline" className="border-emerald-200 dark:border-emerald-800">
                  <Search className="size-4 mr-2" /> Filter
                </Button>
              </div>

              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Entity ID</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          {format(parseISO(log.createdAt), 'MMM dd, HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-sm">{log.user?.name || 'System'}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.entity}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{log.entityId ? log.entityId.slice(0, 8) + '...' : '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {log.details || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {auditLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          <FileText className="size-8 mx-auto mb-2 opacity-50" />
                          No audit logs found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
