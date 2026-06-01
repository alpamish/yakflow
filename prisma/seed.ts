import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

interface SeedData {
  companyProfile: {
    name: string; legalName: string; taxId: string; address: string; city: string;
    country: string; phone: string; email: string; website: string; baseCurrency: string;
  }
  currencies: { code: string; name: string; symbol: string }[]
  exchangeRates: { fromCurrency: string; toCurrency: string; rate: number; date: string; source: string }[]
  customers: { name: string; code: string; type: string }[]
  vendors: { name: string; code: string }[]
  voyage: {
    voyageNumber: string; vesselName: string; sailingRoute: string; departurePort: string;
    arrivalPort: string; etd: string; eta: string | null; shippingLine: string; status: string;
    remarks: string;
    voyageExpenses: { expenseType: string; amount: number; currency: string; description: string; paymentStatus: string }[]
    voyageRevenues: { revenueType: string; amount: number; currency: string; description: string; paymentStatus: string }[]
    teuRecord: {
      totalContainers: number; totalTEUs: number; loadedTEUs: number; emptyTEUs: number;
      twentyFoot: number; fortyFoot: number; fortyFiveFoot: number; reeferUnits: number; specialUnits: number;
    }
  }
  shipments: {
    direction: string; transportMode: string; customerName: string | null;
    shipper: string | null; consignee: string | null; notifyParty: string | null;
    bookingNumber: string | null; blNumber: string | null; cargoType: string;
    imoClass: string | null; portOfLoading: string | null; portOfDischarge: string | null;
    etd: string | null; vesselName: string; voyageNumber: string; freeDays: number;
    status: string; term: string | null; isEmpty: boolean; remarks?: string;
    containers: { containerType: string; unitCount: number; teuCount: number }[]
    revenues: { revenueType: string; amount: number; currency: string; description: string; paymentStatus: string }[]
    expenses: { expenseType: string; amount: number; quantity?: number; unitPrice?: number; description: string; paymentStatus: string }[]
    invoicingParty?: string | null; qn?: string | null; igOog?: string | null;
    containerOwner?: string | null; pickUpFeeNotes?: string | null; notes?: string | null;
  }[]
  users: { email: string; name: string; password: string; role: string }[]
}

const rateMap: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.25,
  RUB: 0.0113,
  TRY: 0.026,
  CNY: 0.138,
}

function normalizeContainerType(raw: string | null): string {
  if (!raw) return '40HC'
  const s = raw.trim().toUpperCase()
  if (s === '20 DC' || s === '20DC') return '20DC'
  if (s === '40 HC' || s === '40HC') return '40HC'
  if (s === '40 DC' || s === '40DC') return '40DC'
  if (s === '20HC') return '20HC'
  if (s === '20 TANK') return '20TK'
  if (s === '40RF') return '40RF'
  return s
}

function getContainerSize(typeStr: string): string {
  const t = typeStr.trim().toUpperCase()
  if (t.startsWith('20')) return '20'
  if (t.startsWith('40')) return '40'
  if (t.startsWith('45')) return '45'
  return '40'
}

function parseDate(val: string | null | undefined): Date | null {
  if (!val) return null
  const dmyMatch = val.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch
    const d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`)
    if (!isNaN(d.getTime())) return d
  }
  const d = new Date(val)
  if (!isNaN(d.getTime())) return d
  return null
}

async function main() {
  console.log('YakFlow ERP - Seeding data...')

  // ============================================
  // CLEAR EXISTING DATA (reverse dependency order)
  // ============================================
  console.log('Clearing existing data...')
  await prisma.organizationUser.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.document.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.shipmentRevenue.deleteMany()
  await prisma.shipmentExpense.deleteMany()
  await prisma.container.deleteMany()
  await prisma.voyageExpense.deleteMany()
  await prisma.voyageRevenue.deleteMany()
  await prisma.voyageTEU.deleteMany()
  await prisma.chargeType.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.shipment.deleteMany()
  await prisma.voyage.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.vendor.deleteMany()
  await prisma.exchangeRate.deleteMany()
  await prisma.currency.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()
  console.log('Existing data cleared.')

  // ============================================
  // LOAD SEED DATA
  // ============================================
  const dataPath = path.join(__dirname, 'seed-data.json')
  const rawData = fs.readFileSync(dataPath, 'utf-8')
  const data: SeedData = JSON.parse(rawData)

  // ============================================
  // 1. ORGANIZATION
  // ============================================
  const orgData = data.companyProfile
  const organization = await prisma.organization.create({
    data: {
      name: orgData.name,
      slug: 'nilemed',
      legalName: orgData.legalName,
      taxId: orgData.taxId,
      address: orgData.address,
      city: orgData.city,
      country: orgData.country,
      phone: orgData.phone,
      email: orgData.email,
      website: orgData.website,
      baseCurrency: orgData.baseCurrency,
    },
  })
  const orgId = organization.id
  console.log(`Created organization: ${organization.name} (${organization.slug})`)

  // ============================================
  // 2. USERS + ORGANIZATION MEMBERSHIPS
  // ============================================
  const users: Record<string, string> = {}
  const passwordHash = await bcrypt.hash('password123', 12)

  for (const u of data.users) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        password: passwordHash,
        isActive: true,
      },
    })
    users[u.email] = user.id

    await prisma.organizationUser.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        role: u.role === 'super_admin' ? 'admin' : u.role,
      },
    })
  }
  console.log(`Created ${data.users.length} users with org memberships`)

  // ============================================
  // 3. CURRENCIES
  // ============================================
  for (const c of data.currencies) {
    await prisma.currency.create({
      data: {
        organizationId: orgId,
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        isActive: true,
      },
    })
  }
  console.log(`Created ${data.currencies.length} currencies`)

  // ============================================
  // 4. EXCHANGE RATES
  // ============================================
  for (const r of data.exchangeRates) {
    await prisma.exchangeRate.create({
      data: {
        organizationId: orgId,
        fromCurrency: r.fromCurrency,
        toCurrency: r.toCurrency,
        rate: r.rate,
        date: parseDate(r.date) || new Date(),
        source: r.source,
      },
    })
  }
  console.log(`Created ${data.exchangeRates.length} exchange rates`)

  // ============================================
  // 5. CUSTOMERS
  // ============================================
  const customerMap: Record<string, string> = {}
  for (const c of data.customers) {
    const customer = await prisma.customer.create({
      data: {
        organizationId: orgId,
        name: c.name,
        code: c.code,
        type: c.type || 'both',
        isActive: true,
      },
    })
    customerMap[c.name] = customer.id
  }
  console.log(`Created ${data.customers.length} customers`)

  // ============================================
  // 6. VENDORS
  // ============================================
  const vendorMap: Record<string, string> = {}
  for (const v of data.vendors) {
    const vendor = await prisma.vendor.create({
      data: {
        organizationId: orgId,
        name: v.name,
        code: v.code,
        type: 'shipping_line',
        isActive: true,
      },
    })
    vendorMap[v.name] = vendor.id
  }
  console.log(`Created ${data.vendors.length} vendors`)

  // ============================================
  // 7. VOYAGE
  // ============================================
  const voyage = await prisma.voyage.create({
    data: {
      organizationId: orgId,
      voyageNumber: data.voyage.voyageNumber,
      vesselName: data.voyage.vesselName,
      sailingRoute: data.voyage.sailingRoute,
      departurePort: data.voyage.departurePort,
      arrivalPort: data.voyage.arrivalPort,
      etd: parseDate(data.voyage.etd),
      eta: parseDate(data.voyage.eta),
      shippingLine: data.voyage.shippingLine,
      status: data.voyage.status,
      remarks: data.voyage.remarks,
    },
  })

  const teu = data.voyage.teuRecord
  const teuUtilization = teu.totalTEUs > 0 ? (teu.loadedTEUs / teu.totalTEUs * 100) : 0
  await prisma.voyageTEU.create({
    data: {
      organizationId: orgId,
      voyageId: voyage.id,
      totalContainers: teu.totalContainers,
      totalTEUs: teu.totalTEUs,
      loadedTEUs: teu.loadedTEUs,
      emptyTEUs: teu.emptyTEUs,
      twentyFoot: teu.twentyFoot,
      fortyFoot: teu.fortyFoot,
      fortyFiveFoot: teu.fortyFiveFoot,
      reeferUnits: teu.reeferUnits,
      specialUnits: teu.specialUnits,
      teuUtilization: Math.round(teuUtilization * 100) / 100,
    },
  })

  for (const ve of data.voyage.voyageExpenses) {
    await prisma.voyageExpense.create({
      data: {
        organizationId: orgId,
        voyageId: voyage.id,
        expenseType: ve.expenseType,
        currency: ve.currency,
        amount: ve.amount,
        quantity: 1,
        description: ve.description,
        paymentStatus: ve.paymentStatus,
      },
    })
  }

  for (const vr of data.voyage.voyageRevenues) {
    await prisma.voyageRevenue.create({
      data: {
        organizationId: orgId,
        voyageId: voyage.id,
        revenueType: vr.revenueType,
        currency: vr.currency,
        amount: vr.amount,
        quantity: 1,
        description: vr.description,
        paymentStatus: vr.paymentStatus,
      },
    })
  }
  console.log(`Created voyage: ${voyage.voyageNumber} with expenses, revenues, TEU`)

  // ============================================
  // 8. SHIPMENTS + CONTAINERS + REVENUES + EXPENSES
  // ============================================
  let totalContainers = 0
  let totalRevenues = 0
  let totalExpenses = 0
  let shipmentCount = 0

  for (let i = 0; i < data.shipments.length; i++) {
    const s = data.shipments[i]
    const shipmentIdx = i + 1
    const direction = s.direction === 'export' ? 'EXP' : 'IMP'
    const shipmentNumber = `STF2607-${direction}-${String(shipmentIdx).padStart(4, '0')}`

    let customerId: string | null = null
    if (s.customerName && customerMap[s.customerName]) {
      customerId = customerMap[s.customerName]
    }

    let originCountry: string | null = null
    let destinationCountry: string | null = null
    if (s.direction === 'export') {
      originCountry = 'Russia'
      if (s.portOfDischarge) {
        const pod = s.portOfDischarge.trim().toUpperCase()
        if (pod.includes('MARPORT') || pod.includes('AMBARLI') || pod.includes('GEBZE') || pod.includes('BELDEPORT')) {
          destinationCountry = 'Turkey'
        } else if (pod.includes('LATAKIA')) {
          destinationCountry = 'Syria'
        } else {
          destinationCountry = 'Turkey'
        }
      }
    } else {
      destinationCountry = 'Russia'
      if (s.portOfLoading) {
        const pol = s.portOfLoading.trim().toUpperCase()
        if (pol.includes('INNSA') || pol.includes('TRMER')) {
          originCountry = 'India'
        } else if (pol.includes('NINGBO') || pol.includes('SHANGHAI')) {
          originCountry = 'China'
        } else {
          originCountry = 'Various'
        }
      }
    }

    let cargoType = s.cargoType || 'general'
    let finalDestination = s.portOfDischarge || null
    let status = s.status || 'in_transit'

    let remarks = ''
    if (s.isEmpty) remarks = 'Empty container repositioning'
    if (s.invoicingParty) remarks += (remarks ? ' | ' : '') + `Invoicing: ${s.invoicingParty}`
    if (s.qn) remarks += (remarks ? ' | ' : '') + `Q/N: ${s.qn}`
    if (s.containerOwner) remarks += (remarks ? ' | ' : '') + `Owner: ${s.containerOwner}`
    if (s.pickUpFeeNotes) remarks += (remarks ? ' | ' : '') + `Pick-up: ${s.pickUpFeeNotes}`
    if (s.notes) remarks += (remarks ? ' | ' : '') + s.notes
    if (s.term) remarks += (remarks ? ' | ' : '') + `Term: ${s.term}`

    const shipment = await prisma.shipment.create({
      data: {
        organizationId: orgId,
        shipmentNumber,
        direction: s.direction,
        transportMode: s.transportMode,
        customerId,
        shipper: s.shipper,
        consignee: s.consinee || s.consignee,
        notifyParty: s.notifyParty,
        bookingNumber: s.bookingNumber,
        blNumber: s.blNumber,
        cargoType,
        imoClass: s.imoClass,
        originCountry,
        destinationCountry,
        portOfLoading: s.portOfLoading,
        portOfDischarge: s.portOfDischarge,
        finalDestination,
        etd: parseDate(s.etd) || parseDate(data.voyage.etd),
        vesselName: s.vesselName,
        voyageNumber: s.voyageNumber,
        voyageId: voyage.id,
        freeDays: s.freeDays || 14,
        status,
        remarks: remarks || null,
      },
    })
    shipmentCount++

    for (const c of s.containers) {
      const containerType = normalizeContainerType(c.containerType)
      const containerSize = getContainerSize(containerType)
      const unitCount = c.unitCount || 1

      for (let j = 0; j < Math.min(unitCount, 200); j++) {
        const containerNumber = `${shipmentNumber}-${containerType}-${String(j + 1).padStart(3, '0')}`
        await prisma.container.create({
          data: {
            organizationId: orgId,
            shipmentId: shipment.id,
            containerNumber,
            containerType,
            containerSize,
            status: s.direction === 'export' ? 'loaded' : 'in_transit',
            currentLocation: s.direction === 'export' ? 'NUTEP Terminal' : 'In Transit',
            deliveryStatus: 'pending',
          },
        })
        totalContainers++
      }
    }

    for (const r of s.revenues) {
      await prisma.shipmentRevenue.create({
        data: {
          organizationId: orgId,
          shipmentId: shipment.id,
          customerId,
          revenueType: r.revenueType,
          quantity: 1,
          unitPrice: r.amount,
          amount: r.amount,
          paymentStatus: r.paymentStatus || 'pending',
        },
      })
      totalRevenues++
    }

    for (const e of s.expenses) {
      let vendorId: string | null = null
      if (e.expenseType === 'dthc' && vendorMap['NUTEP Terminal']) {
        vendorId = vendorMap['NUTEP Terminal']
      } else if (e.expenseType === 'x_ray') {
        vendorId = vendorMap['NILE MED'] || null
      }

      await prisma.shipmentExpense.create({
        data: {
          organizationId: orgId,
          shipmentId: shipment.id,
          expenseType: e.expenseType,
          vendorId,
          quantity: e.quantity ?? 1,
          unitPrice: e.unitPrice ?? e.amount,
          amount: e.amount,
          paymentStatus: e.paymentStatus || 'pending',
          notes: e.description,
        },
      })
      totalExpenses++
    }
  }

  console.log(`Created ${shipmentCount} shipments, ${totalContainers} containers, ${totalRevenues} revenues, ${totalExpenses} expenses`)

  // ============================================
  // 9. CHARGE TYPES
  // ============================================
  const chargeTypes = [
    { type: 'expense', value: 'othc', label: 'OTHC' },
    { type: 'expense', value: 'dthc', label: 'DTHC' },
    { type: 'expense', value: 'x_ray', label: 'X-RAY' },
    { type: 'expense', value: 'inspection', label: 'INSPECTION' },
    { type: 'expense', value: 'd_and_d', label: 'D&D' },
    { type: 'expense', value: 'storage', label: 'STORAGE' },
    { type: 'expense', value: 'doc', label: 'DOC' },
    { type: 'expense', value: 'pick_up', label: 'PICK UP' },
    { type: 'revenue', value: 'othc', label: 'OTHC' },
    { type: 'revenue', value: 'dthc', label: 'DTHC' },
    { type: 'revenue', value: 'x_ray', label: 'X-RAY' },
    { type: 'revenue', value: 'inspection', label: 'INSPECTION' },
    { type: 'revenue', value: 'd_and_d', label: 'D&D' },
    { type: 'revenue', value: 'storage', label: 'STORAGE' },
    { type: 'revenue', value: 'doc', label: 'DOC' },
    { type: 'revenue', value: 'pick_up', label: 'PICK UP' },
  ]

  for (const ct of chargeTypes) {
    await prisma.chargeType.upsert({
      where: {
        organizationId_type_value: {
          organizationId: orgId,
          type: ct.type,
          value: ct.value,
        },
      },
      update: { label: ct.label },
      create: { ...ct, organizationId: orgId },
    })
  }
  console.log(`Created ${chargeTypes.length} charge types`)

  // ============================================
  // SUMMARY
  // ============================================
  const totalShipmentCount = await prisma.shipment.count()
  const totalContainerCount = await prisma.container.count()
  const totalCustomerCount = await prisma.customer.count()
  const totalVendorCount = await prisma.vendor.count()

  console.log('\n--- SEED COMPLETE ---')
  console.log(`Organization: ${organization.name}`)
  console.log(`Shipments:  ${totalShipmentCount}`)
  console.log(`Containers: ${totalContainerCount}`)
  console.log(`Customers:  ${totalCustomerCount}`)
  console.log(`Vendors:    ${totalVendorCount}`)
  console.log(`Voyage:     ${voyage.voyageNumber}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
