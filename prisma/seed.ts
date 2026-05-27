import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Clearing existing data...')

  // Delete in reverse dependency order
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
  await prisma.invoice.deleteMany()
  await prisma.shipment.deleteMany()
  await prisma.voyage.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.vendor.deleteMany()
  await prisma.exchangeRate.deleteMany()
  await prisma.currency.deleteMany()
  await prisma.companyProfile.deleteMany()
  await prisma.user.deleteMany()

  console.log('Existing data cleared. Creating seed data...')

  // ============================================
  // 1. USER
  // ============================================
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@freightflow.com',
      name: 'Ahmed Al-Rashid',
      password: '$2a$10$dummyhashforseedpurposesonly',
      role: 'super_admin',
      isActive: true,
      lastLoginAt: new Date('2025-02-25T09:30:00Z'),
    },
  })

  // ============================================
  // 2. COMPANY PROFILE
  // ============================================
  const company = await prisma.companyProfile.create({
    data: {
      name: 'FreightFlow Logistics Co.',
      legalName: 'FreightFlow Logistics Co. LLC',
      taxId: 'AE-30042-TAX',
      address: 'Office 1205, Jebel Ali Free Zone Tower',
      city: 'Dubai',
      country: 'United Arab Emirates',
      phone: '+971-4-888-7600',
      email: 'info@freightflow.ae',
      website: 'https://www.freightflow.ae',
      baseCurrency: 'USD',
    },
  })
  console.log(`Created company: ${company.name}`)

  // ============================================
  // 3. CURRENCIES
  // ============================================
  const currencies = await Promise.all([
    prisma.currency.create({
      data: { code: 'USD', name: 'US Dollar', symbol: '$', isActive: true },
    }),
    prisma.currency.create({
      data: { code: 'EUR', name: 'Euro', symbol: '\u20AC', isActive: true },
    }),
    prisma.currency.create({
      data: { code: 'GBP', name: 'British Pound', symbol: '\u00A3', isActive: true },
    }),
    prisma.currency.create({
      data: { code: 'AED', name: 'UAE Dirham', symbol: 'AED', isActive: true },
    }),
    prisma.currency.create({
      data: { code: 'CNY', name: 'Chinese Yuan', symbol: '\u00A5', isActive: true },
    }),
    prisma.currency.create({
      data: { code: 'INR', name: 'Indian Rupee', symbol: '\u20B9', isActive: true },
    }),
  ])
  console.log(`Created ${currencies.length} currencies`)

  // ============================================
  // 4. EXCHANGE RATES
  // ============================================
  const rateDate = new Date('2025-03-01T00:00:00Z')
  const exchangeRates = await Promise.all([
    prisma.exchangeRate.create({
      data: { fromCurrency: 'USD', toCurrency: 'USD', rate: 1.0, date: rateDate, source: 'manual' },
    }),
    prisma.exchangeRate.create({
      data: { fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.09, date: rateDate, source: 'manual' },
    }),
    prisma.exchangeRate.create({
      data: { fromCurrency: 'GBP', toCurrency: 'USD', rate: 1.27, date: rateDate, source: 'manual' },
    }),
    prisma.exchangeRate.create({
      data: { fromCurrency: 'AED', toCurrency: 'USD', rate: 0.27, date: rateDate, source: 'manual' },
    }),
    prisma.exchangeRate.create({
      data: { fromCurrency: 'CNY', toCurrency: 'USD', rate: 0.14, date: rateDate, source: 'manual' },
    }),
    prisma.exchangeRate.create({
      data: { fromCurrency: 'INR', toCurrency: 'USD', rate: 0.012, date: rateDate, source: 'manual' },
    }),
  ])
  console.log(`Created ${exchangeRates.length} exchange rates`)

  // Exchange rate lookup helper
  const rateMap: Record<string, number> = {
    USD: 1.0,
    EUR: 1.09,
    GBP: 1.27,
    AED: 0.27,
    CNY: 0.14,
    INR: 0.012,
  }

  // ============================================
  // 5. CUSTOMERS
  // ============================================
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Global Trading Corp',
        code: 'GTC-001',
        type: 'importer',
        email: 'contact@globaltrading.com',
        phone: '+1-212-555-0101',
        address: '350 Fifth Avenue, Suite 3200',
        city: 'New York',
        country: 'USA',
        taxId: 'US-12-3456789',
        creditLimit: 500000,
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Pacific Exports Ltd',
        code: 'PEL-002',
        type: 'exporter',
        email: 'exports@pacificexports.cn',
        phone: '+86-21-5555-0202',
        address: '88 Lujiazui Finance Centre',
        city: 'Shanghai',
        country: 'China',
        taxId: 'CN-91310000MA1FL5',
        creditLimit: 350000,
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Euro Freight Services',
        code: 'EFS-003',
        type: 'both',
        email: 'ops@eurofreight.de',
        phone: '+49-40-5555-0303',
        address: 'Am Sandtorkai 48',
        city: 'Hamburg',
        country: 'Germany',
        taxId: 'DE-123456789',
        creditLimit: 750000,
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Middle East Logistics',
        code: 'MEL-004',
        type: 'importer',
        email: 'info@melogistics.ae',
        phone: '+971-4-555-0404',
        address: 'Jebel Ali Free Zone, Block 14',
        city: 'Dubai',
        country: 'UAE',
        taxId: 'AE-30042-MEL',
        creditLimit: 600000,
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Asia Pacific Trading',
        code: 'APT-005',
        type: 'both',
        email: 'trade@asiapacific.in',
        phone: '+91-22-5555-0505',
        address: 'Nariman Point, Mittal Chambers',
        city: 'Mumbai',
        country: 'India',
        taxId: 'IN-27AABCU9603',
        creditLimit: 400000,
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Atlantic Shipping Co',
        code: 'ASC-006',
        type: 'exporter',
        email: 'ops@atlanticshipping.co.uk',
        phone: '+44-20-5555-0606',
        address: '1 Canada Square, Canary Wharf',
        city: 'London',
        country: 'UK',
        taxId: 'GB-123456789',
        creditLimit: 550000,
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Gulf Import Export',
        code: 'GIE-007',
        type: 'both',
        email: 'trade@gulfimportexport.sa',
        phone: '+966-12-555-0707',
        address: 'King Fahd Road, Al Salam Center',
        city: 'Jeddah',
        country: 'Saudi Arabia',
        taxId: 'SA-3000420070',
        creditLimit: 450000,
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Continental Freight',
        code: 'CFR-008',
        type: 'importer',
        email: 'cargo@continentalfreight.ae',
        phone: '+971-2-555-0808',
        address: 'Abu Dhabi Industrial Area, Plot 22',
        city: 'Abu Dhabi',
        country: 'UAE',
        taxId: 'AE-50012-CFR',
        creditLimit: 380000,
        isActive: true,
      },
    }),
  ])
  console.log(`Created ${customers.length} customers`)

  // ============================================
  // 6. VENDORS
  // ============================================
  const vendors = await Promise.all([
    prisma.vendor.create({
      data: {
        name: 'Maersk Line',
        code: 'MAE-001',
        type: 'shipping_line',
        email: 'booking@maersk.com',
        phone: '+45-3363-3363',
        address: '50 Esplanaden',
        city: 'Copenhagen',
        country: 'Denmark',
        taxId: 'DK-12345678',
        isActive: true,
      },
    }),
    prisma.vendor.create({
      data: {
        name: 'Dubai Port Authority',
        code: 'DPA-002',
        type: 'port',
        email: 'ops@dpa.ae',
        phone: '+971-4-808-0808',
        address: 'Jebel Ali Port Authority Building',
        city: 'Dubai',
        country: 'UAE',
        taxId: 'AE-DPA-001',
        isActive: true,
      },
    }),
    prisma.vendor.create({
      data: {
        name: 'Global Customs Agency',
        code: 'GCA-003',
        type: 'customs',
        email: 'clearance@globalcustoms.ae',
        phone: '+971-4-333-0303',
        address: 'Dubai Customs Building, Deira',
        city: 'Dubai',
        country: 'UAE',
        taxId: 'AE-GCA-045',
        isActive: true,
      },
    }),
    prisma.vendor.create({
      data: {
        name: 'FastTrack Transport',
        code: 'FTT-004',
        type: 'transport',
        email: 'dispatch@fasttrack.ae',
        phone: '+971-4-222-0404',
        address: 'Al Quoz Industrial Area 3',
        city: 'Dubai',
        country: 'UAE',
        taxId: 'AE-FTT-012',
        isActive: true,
      },
    }),
    prisma.vendor.create({
      data: {
        name: 'Secure Warehouse Co',
        code: 'SWC-005',
        type: 'warehouse',
        email: 'ops@securewarehouse.ae',
        phone: '+971-4-111-0505',
        address: 'JAFZA South, Warehouse 18',
        city: 'Dubai',
        country: 'UAE',
        taxId: 'AE-SWC-078',
        isActive: true,
      },
    }),
    prisma.vendor.create({
      data: {
        name: 'Port Services International',
        code: 'PSI-006',
        type: 'port',
        email: 'services@portservices.ae',
        phone: '+971-4-666-0606',
        address: 'Port Rashid, Terminal 2',
        city: 'Dubai',
        country: 'UAE',
        taxId: 'AE-PSI-033',
        isActive: true,
      },
    }),
  ])
  console.log(`Created ${vendors.length} vendors`)

  // ============================================
  // 7. SHIPMENTS
  // ============================================
  const shipmentsData = [
    // Import/Sea - in_transit
    {
      shipmentNumber: 'SHP-2025-0001',
      direction: 'import',
      transportMode: 'sea',
      customerId: customers[3].id, // Middle East Logistics
      shipper: 'Pacific Exports Ltd',
      consignee: 'Middle East Logistics',
      notifyParty: 'FreightFlow Logistics Co.',
      bookingNumber: 'BK-SH-2025001',
      blNumber: 'MAEU-SH-25001',
      cargoType: 'general',
      imoClass: 'NON-IMO',
      originCountry: 'China',
      destinationCountry: 'UAE',
      portOfLoading: 'Shanghai',
      portOfDischarge: 'Jebel Ali',
      finalDestination: 'Dubai, UAE',
      etd: new Date('2025-02-15T00:00:00Z'),
      eta: new Date('2025-03-05T00:00:00Z'),
      vesselName: 'Ever Given',
      voyageNumber: 'VOY-2025-0001',
      freeDays: 14,
      status: 'in_transit',
      remarks: 'General cargo - electronics and textiles',
    },
    // Import/Sea - arrived
    {
      shipmentNumber: 'SHP-2025-0002',
      direction: 'import',
      transportMode: 'sea',
      customerId: customers[7].id, // Continental Freight
      shipper: 'Hamburg Export GmbH',
      consignee: 'Continental Freight',
      notifyParty: 'FreightFlow Logistics Co.',
      bookingNumber: 'BK-SH-2025002',
      blNumber: 'MAEU-SH-25002',
      cargoType: 'general',
      imoClass: 'NON-IMO',
      originCountry: 'Germany',
      destinationCountry: 'UAE',
      portOfLoading: 'Hamburg',
      portOfDischarge: 'Jebel Ali',
      finalDestination: 'Abu Dhabi, UAE',
      etd: new Date('2025-01-20T00:00:00Z'),
      eta: new Date('2025-02-18T00:00:00Z'),
      vesselName: 'Maersk Elba',
      voyageNumber: 'VOY-2025-0002',
      freeDays: 14,
      status: 'arrived',
      remarks: 'Industrial machinery and auto parts',
    },
    // Import/Sea - delivered
    {
      shipmentNumber: 'SHP-2025-0003',
      direction: 'import',
      transportMode: 'sea',
      customerId: customers[0].id, // Global Trading Corp
      shipper: 'Mumbai Trading House',
      consignee: 'Global Trading Corp',
      notifyParty: 'FreightFlow Logistics Co.',
      bookingNumber: 'BK-SH-2025003',
      blNumber: 'MSCU-SH-25003',
      cargoType: 'perishable',
      imoClass: 'NON-IMO',
      originCountry: 'India',
      destinationCountry: 'UAE',
      portOfLoading: 'Mumbai',
      portOfDischarge: 'Jebel Ali',
      finalDestination: 'Dubai, UAE',
      etd: new Date('2025-01-05T00:00:00Z'),
      eta: new Date('2025-01-15T00:00:00Z'),
      vesselName: 'MSC Oscar',
      voyageNumber: 'VOY-2025-0003',
      freeDays: 7,
      status: 'delivered',
      remarks: 'Perishable food items - reefer containers',
    },
    // Import/Sea - customs_clearance
    {
      shipmentNumber: 'SHP-2025-0004',
      direction: 'import',
      transportMode: 'sea',
      customerId: customers[4].id, // Asia Pacific Trading
      shipper: 'Shanghai Imports Co.',
      consignee: 'Asia Pacific Trading',
      notifyParty: 'FreightFlow Logistics Co.',
      bookingNumber: 'BK-SH-2025004',
      blNumber: 'CMAU-SH-25004',
      cargoType: 'hazardous',
      imoClass: 'IMO',
      originCountry: 'China',
      destinationCountry: 'Saudi Arabia',
      portOfLoading: 'Shanghai',
      portOfDischarge: 'Jeddah',
      finalDestination: 'Riyadh, Saudi Arabia',
      etd: new Date('2025-02-01T00:00:00Z'),
      eta: new Date('2025-02-20T00:00:00Z'),
      vesselName: 'CMA CGM Marco Polo',
      voyageNumber: 'VOY-2025-0004',
      freeDays: 14,
      status: 'customs_clearance',
      remarks: 'Hazardous chemicals - IMO Class 3 pending customs approval',
    },
    // Export/Sea - booked
    {
      shipmentNumber: 'SHP-2025-0005',
      direction: 'export',
      transportMode: 'sea',
      customerId: customers[5].id, // Atlantic Shipping Co
      shipper: 'FreightFlow Logistics Co.',
      consignee: 'Atlantic Shipping Co',
      notifyParty: 'Atlantic Shipping Co',
      bookingNumber: 'BK-SH-2025005',
      blNumber: 'MAEU-SH-25005',
      cargoType: 'general',
      imoClass: 'NON-IMO',
      originCountry: 'UAE',
      destinationCountry: 'UK',
      portOfLoading: 'Jebel Ali',
      portOfDischarge: 'Rotterdam',
      finalDestination: 'London, UK',
      etd: new Date('2025-03-15T00:00:00Z'),
      eta: new Date('2025-04-05T00:00:00Z'),
      vesselName: 'Maersk Elba',
      voyageNumber: 'VOY-2025-0002',
      freeDays: 14,
      status: 'booked',
      remarks: 'Petrochemical products for UK market',
    },
    // Export/Sea - loading
    {
      shipmentNumber: 'SHP-2025-0006',
      direction: 'export',
      transportMode: 'sea',
      customerId: customers[6].id, // Gulf Import Export
      shipper: 'Gulf Import Export',
      consignee: 'Euro Freight Services',
      notifyParty: 'FreightFlow Logistics Co.',
      bookingNumber: 'BK-SH-2025006',
      blNumber: null,
      cargoType: 'general',
      imoClass: 'NON-IMO',
      originCountry: 'Saudi Arabia',
      destinationCountry: 'Germany',
      portOfLoading: 'Jeddah',
      portOfDischarge: 'Hamburg',
      finalDestination: 'Hamburg, Germany',
      etd: new Date('2025-03-10T00:00:00Z'),
      eta: new Date('2025-04-01T00:00:00Z'),
      vesselName: 'CMA CGM Marco Polo',
      voyageNumber: 'VOY-2025-0004',
      freeDays: 14,
      status: 'loading',
      remarks: 'Construction materials for Hamburg',
    },
    // Export/Sea - in_transit
    {
      shipmentNumber: 'SHP-2025-0007',
      direction: 'export',
      transportMode: 'sea',
      customerId: customers[2].id, // Euro Freight Services
      shipper: 'FreightFlow Logistics Co.',
      consignee: 'Euro Freight Services',
      notifyParty: 'Euro Freight Services',
      bookingNumber: 'BK-SH-2025007',
      blNumber: 'MSCU-SH-25007',
      cargoType: 'general',
      imoClass: 'NON-IMO',
      originCountry: 'UAE',
      destinationCountry: 'India',
      portOfLoading: 'Jebel Ali',
      portOfDischarge: 'Mumbai',
      finalDestination: 'Mumbai, India',
      etd: new Date('2025-02-20T00:00:00Z'),
      eta: new Date('2025-03-02T00:00:00Z'),
      vesselName: 'MSC Oscar',
      voyageNumber: 'VOY-2025-0003',
      freeDays: 14,
      status: 'in_transit',
      remarks: 'Re-export goods to Indian market',
    },
    // Import/Air - arrived
    {
      shipmentNumber: 'SHP-2025-0008',
      direction: 'import',
      transportMode: 'air',
      customerId: customers[0].id, // Global Trading Corp
      shipper: 'London Pharma Ltd',
      consignee: 'Global Trading Corp',
      notifyParty: 'FreightFlow Logistics Co.',
      bookingNumber: null,
      blNumber: null,
      awbNumber: 'EK-2025-88012345',
      cargoType: 'perishable',
      imoClass: 'NON-IMO',
      originCountry: 'UK',
      destinationCountry: 'UAE',
      portOfLoading: 'London Heathrow',
      portOfDischarge: 'Dubai International',
      finalDestination: 'Dubai, UAE',
      etd: new Date('2025-02-28T00:00:00Z'),
      eta: new Date('2025-03-01T00:00:00Z'),
      vesselName: null,
      voyageNumber: null,
      freeDays: 3,
      status: 'arrived',
      remarks: 'Pharmaceutical products - urgent air freight',
    },
    // Import/Air - delivered
    {
      shipmentNumber: 'SHP-2025-0009',
      direction: 'import',
      transportMode: 'air',
      customerId: customers[3].id, // Middle East Logistics
      shipper: 'Beijing Electronics Co.',
      consignee: 'Middle East Logistics',
      notifyParty: 'FreightFlow Logistics Co.',
      bookingNumber: null,
      blNumber: null,
      awbNumber: 'EK-2025-88012346',
      cargoType: 'general',
      imoClass: 'NON-IMO',
      originCountry: 'China',
      destinationCountry: 'UAE',
      portOfLoading: 'Beijing Capital',
      portOfDischarge: 'Dubai International',
      finalDestination: 'Dubai, UAE',
      etd: new Date('2025-02-10T00:00:00Z'),
      eta: new Date('2025-02-11T00:00:00Z'),
      vesselName: null,
      voyageNumber: null,
      freeDays: 3,
      status: 'delivered',
      remarks: 'High-value electronics - priority air freight',
    },
    // Export/Land - in_transit
    {
      shipmentNumber: 'SHP-2025-0010',
      direction: 'export',
      transportMode: 'land',
      customerId: customers[6].id, // Gulf Import Export
      shipper: 'Gulf Import Export',
      consignee: 'Riyadh Distribution Center',
      notifyParty: 'FreightFlow Logistics Co.',
      bookingNumber: null,
      blNumber: null,
      cargoType: 'general',
      imoClass: 'NON-IMO',
      originCountry: 'UAE',
      destinationCountry: 'Saudi Arabia',
      portOfLoading: 'Dubai',
      portOfDischarge: 'Riyadh',
      finalDestination: 'Riyadh, Saudi Arabia',
      etd: new Date('2025-02-27T00:00:00Z'),
      eta: new Date('2025-03-02T00:00:00Z'),
      vesselName: null,
      voyageNumber: null,
      freeDays: 7,
      status: 'in_transit',
      remarks: 'FMCG goods via land transport to Riyadh',
    },
    // Export/Land - delivered
    {
      shipmentNumber: 'SHP-2025-0011',
      direction: 'export',
      transportMode: 'land',
      customerId: customers[4].id, // Asia Pacific Trading
      shipper: 'Asia Pacific Trading',
      consignee: 'Muscat Trading Co.',
      notifyParty: 'FreightFlow Logistics Co.',
      bookingNumber: null,
      blNumber: null,
      cargoType: 'oversized',
      imoClass: 'NON-IMO',
      originCountry: 'UAE',
      destinationCountry: 'Oman',
      portOfLoading: 'Dubai',
      portOfDischarge: 'Muscat',
      finalDestination: 'Muscat, Oman',
      etd: new Date('2025-02-15T00:00:00Z'),
      eta: new Date('2025-02-17T00:00:00Z'),
      vesselName: null,
      voyageNumber: null,
      freeDays: 7,
      status: 'delivered',
      remarks: 'Oversized construction equipment - special permit',
    },
    // Import/Sea - draft
    {
      shipmentNumber: 'SHP-2025-0012',
      direction: 'import',
      transportMode: 'sea',
      customerId: customers[2].id, // Euro Freight Services
      shipper: 'Rotterdam Steel BV',
      consignee: 'Euro Freight Services',
      notifyParty: 'FreightFlow Logistics Co.',
      bookingNumber: null,
      blNumber: null,
      cargoType: 'oversized',
      imoClass: 'NON-IMO',
      originCountry: 'Germany',
      destinationCountry: 'UAE',
      portOfLoading: 'Rotterdam',
      portOfDischarge: 'Jebel Ali',
      finalDestination: 'Dubai, UAE',
      etd: new Date('2025-04-01T00:00:00Z'),
      eta: new Date('2025-04-20T00:00:00Z'),
      vesselName: 'Yang Ming Unity',
      voyageNumber: 'VOY-2025-0005',
      freeDays: 21,
      status: 'draft',
      remarks: 'Steel structures - awaiting booking confirmation',
    },
  ]

  const shipments: Awaited<ReturnType<typeof prisma.shipment.create>>[] = []
  for (const data of shipmentsData) {
    const shipment = await prisma.shipment.create({ data })
    shipments.push(shipment)
  }
  console.log(`Created ${shipments.length} shipments`)

  // ============================================
  // 8. CONTAINERS (2-3 per shipment)
  // ============================================
  const containersData = [
    // SHP-2025-0001 (Import/Sea/in_transit)
    { shipmentId: shipments[0].id, containerNumber: 'MSCU-7234561', containerType: '40HC', containerSize: '40', sealNumber: 'SL-25001A', grossWeight: 28500, netWeight: 26000, volume: 67.5, status: 'in_transit', currentLocation: 'Indian Ocean', deliveryStatus: 'in_transit' },
    { shipmentId: shipments[0].id, containerNumber: 'MSCU-7234562', containerType: '40HC', containerSize: '40', sealNumber: 'SL-25001B', grossWeight: 27800, netWeight: 25200, volume: 65.8, status: 'in_transit', currentLocation: 'Indian Ocean', deliveryStatus: 'in_transit' },
    { shipmentId: shipments[0].id, containerNumber: 'MSCU-7234563', containerType: '20DC', containerSize: '20', sealNumber: 'SL-25001C', grossWeight: 18200, netWeight: 16500, volume: 28.3, status: 'in_transit', currentLocation: 'Indian Ocean', deliveryStatus: 'in_transit' },

    // SHP-2025-0002 (Import/Sea/arrived)
    { shipmentId: shipments[1].id, containerNumber: 'MAEU-4123901', containerType: '40DC', containerSize: '40', sealNumber: 'SL-25002A', grossWeight: 32100, netWeight: 29500, volume: 58.2, status: 'arrived', currentLocation: 'Jebel Ali Port', deliveryStatus: 'pending' },
    { shipmentId: shipments[1].id, containerNumber: 'MAEU-4123902', containerType: '40DC', containerSize: '40', sealNumber: 'SL-25002B', grossWeight: 30500, netWeight: 27800, volume: 55.6, status: 'arrived', currentLocation: 'Jebel Ali Port', deliveryStatus: 'pending' },

    // SHP-2025-0003 (Import/Sea/delivered)
    { shipmentId: shipments[2].id, containerNumber: 'MSCU-8567123', containerType: 'Reefer', containerSize: '40', sealNumber: 'SL-25003A', grossWeight: 24500, netWeight: 22000, volume: 62.4, status: 'delivered', currentLocation: 'Dubai Cold Storage', deliveryStatus: 'delivered' },
    { shipmentId: shipments[2].id, containerNumber: 'MSCU-8567124', containerType: 'Reefer', containerSize: '40', sealNumber: 'SL-25003B', grossWeight: 23800, netWeight: 21200, volume: 60.1, status: 'delivered', currentLocation: 'Dubai Cold Storage', deliveryStatus: 'delivered' },
    { shipmentId: shipments[2].id, containerNumber: 'MSCU-8567125', containerType: '20DC', containerSize: '20', sealNumber: 'SL-25003C', grossWeight: 15600, netWeight: 13800, volume: 25.5, status: 'delivered', currentLocation: 'Dubai Cold Storage', deliveryStatus: 'delivered' },

    // SHP-2025-0004 (Import/Sea/customs_clearance)
    { shipmentId: shipments[3].id, containerNumber: 'CMAU-3345678', containerType: '20DC', containerSize: '20', sealNumber: 'SL-25004A', grossWeight: 19800, netWeight: 17500, volume: 30.2, status: 'arrived', currentLocation: 'Jeddah Customs', deliveryStatus: 'pending' },
    { shipmentId: shipments[3].id, containerNumber: 'CMAU-3345679', containerType: '20DC', containerSize: '20', sealNumber: 'SL-25004B', grossWeight: 20500, netWeight: 18200, volume: 31.8, status: 'arrived', currentLocation: 'Jeddah Customs', deliveryStatus: 'pending' },

    // SHP-2025-0005 (Export/Sea/booked)
    { shipmentId: shipments[4].id, containerNumber: 'MAEU-9988771', containerType: '40HC', containerSize: '40', sealNumber: null, grossWeight: null, netWeight: null, volume: null, status: 'empty', currentLocation: 'Jebel Ali Yard', deliveryStatus: 'pending' },
    { shipmentId: shipments[4].id, containerNumber: 'MAEU-9988772', containerType: '40DC', containerSize: '40', sealNumber: null, grossWeight: null, netWeight: null, volume: null, status: 'empty', currentLocation: 'Jebel Ali Yard', deliveryStatus: 'pending' },

    // SHP-2025-0006 (Export/Sea/loading)
    { shipmentId: shipments[5].id, containerNumber: 'CMAU-5566771', containerType: '40DC', containerSize: '40', sealNumber: 'SL-25006A', grossWeight: 26700, netWeight: 24000, volume: 52.3, status: 'loaded', currentLocation: 'Jeddah Port', deliveryStatus: 'pending' },
    { shipmentId: shipments[5].id, containerNumber: 'CMAU-5566772', containerType: '20DC', containerSize: '20', sealNumber: 'SL-25006B', grossWeight: 17800, netWeight: 15500, volume: 27.8, status: 'loaded', currentLocation: 'Jeddah Port', deliveryStatus: 'pending' },
    { shipmentId: shipments[5].id, containerNumber: 'CMAU-5566773', containerType: '40HC', containerSize: '40', sealNumber: 'SL-25006C', grossWeight: 29500, netWeight: 26800, volume: 64.1, status: 'loaded', currentLocation: 'Jeddah Port', deliveryStatus: 'pending' },

    // SHP-2025-0007 (Export/Sea/in_transit)
    { shipmentId: shipments[6].id, containerNumber: 'MSCU-1122331', containerType: '40DC', containerSize: '40', sealNumber: 'SL-25007A', grossWeight: 31200, netWeight: 28500, volume: 56.9, status: 'in_transit', currentLocation: 'Arabian Sea', deliveryStatus: 'in_transit' },
    { shipmentId: shipments[6].id, containerNumber: 'MSCU-1122332', containerType: '20DC', containerSize: '20', sealNumber: 'SL-25007B', grossWeight: 16900, netWeight: 14800, volume: 26.4, status: 'in_transit', currentLocation: 'Arabian Sea', deliveryStatus: 'in_transit' },

    // SHP-2025-0008 (Import/Air/arrived)
    { shipmentId: shipments[7].id, containerNumber: 'AIR-EK-8801', containerType: '20DC', containerSize: '20', sealNumber: null, grossWeight: 4200, netWeight: 3800, volume: 18.5, status: 'arrived', currentLocation: 'Dubai Airport Cargo', deliveryStatus: 'pending' },
    { shipmentId: shipments[7].id, containerNumber: 'AIR-EK-8802', containerType: '20DC', containerSize: '20', sealNumber: null, grossWeight: 3900, netWeight: 3500, volume: 16.2, status: 'arrived', currentLocation: 'Dubai Airport Cargo', deliveryStatus: 'pending' },

    // SHP-2025-0009 (Import/Air/delivered)
    { shipmentId: shipments[8].id, containerNumber: 'AIR-EK-8803', containerType: '40DC', containerSize: '40', sealNumber: null, grossWeight: 6500, netWeight: 5800, volume: 32.4, status: 'delivered', currentLocation: 'Dubai Warehouse', deliveryStatus: 'delivered' },

    // SHP-2025-0010 (Export/Land/in_transit)
    { shipmentId: shipments[9].id, containerNumber: 'TRK-UAE-5001', containerType: '40DC', containerSize: '40', sealNumber: 'SL-25010A', grossWeight: 22800, netWeight: 20000, volume: 48.5, status: 'in_transit', currentLocation: 'UAE-Saudi Border', deliveryStatus: 'in_transit' },
    { shipmentId: shipments[9].id, containerNumber: 'TRK-UAE-5002', containerType: '20DC', containerSize: '20', sealNumber: 'SL-25010B', grossWeight: 15200, netWeight: 13000, volume: 24.8, status: 'in_transit', currentLocation: 'UAE-Saudi Border', deliveryStatus: 'in_transit' },

    // SHP-2025-0011 (Export/Land/delivered)
    { shipmentId: shipments[10].id, containerNumber: 'TRK-UAE-6001', containerType: '40HC', containerSize: '40', sealNumber: 'SL-25011A', grossWeight: 35200, netWeight: 32000, volume: 72.0, status: 'delivered', currentLocation: 'Muscat Warehouse', deliveryStatus: 'delivered' },
    { shipmentId: shipments[10].id, containerNumber: 'TRK-UAE-6002', containerType: '40HC', containerSize: '40', sealNumber: 'SL-25011B', grossWeight: 34500, netWeight: 31500, volume: 70.2, status: 'delivered', currentLocation: 'Muscat Warehouse', deliveryStatus: 'delivered' },
    { shipmentId: shipments[10].id, containerNumber: 'TRK-UAE-6003', containerType: '20DC', containerSize: '20', sealNumber: 'SL-25011C', grossWeight: 18800, netWeight: 16500, volume: 29.5, status: 'delivered', currentLocation: 'Muscat Warehouse', deliveryStatus: 'delivered' },

    // SHP-2025-0012 (Import/Sea/draft)
    { shipmentId: shipments[11].id, containerNumber: 'YMMU-7788901', containerType: '40HC', containerSize: '40', sealNumber: null, grossWeight: null, netWeight: null, volume: null, status: 'empty', currentLocation: 'Rotterdam Yard', deliveryStatus: 'pending' },
    { shipmentId: shipments[11].id, containerNumber: 'YMMU-7788902', containerType: '40HC', containerSize: '40', sealNumber: null, grossWeight: null, netWeight: null, volume: null, status: 'empty', currentLocation: 'Rotterdam Yard', deliveryStatus: 'pending' },
    { shipmentId: shipments[11].id, containerNumber: 'YMMU-7788903', containerType: '20DC', containerSize: '20', sealNumber: null, grossWeight: null, netWeight: null, volume: null, status: 'empty', currentLocation: 'Rotterdam Yard', deliveryStatus: 'pending' },
  ]

  const containers: Awaited<ReturnType<typeof prisma.container.create>>[] = []
  for (const data of containersData) {
    const container = await prisma.container.create({ data })
    containers.push(container)
  }
  console.log(`Created ${containers.length} containers`)

  // ============================================
  // 9. SHIPMENT EXPENSES (2-3 per shipment)
  // ============================================
  const shipmentExpensesData = [
    // SHP-2025-0001
    { shipmentId: shipments[0].id, expenseType: 'ocean_freight', vendorId: vendors[0].id, currency: 'USD', exchangeRate: 1.0, amount: 8500, tax: 425, amountBase: 8500, taxBase: 425, paymentStatus: 'paid', invoiceNumber: 'INV-OFR-25001', notes: 'Sea freight Shanghai to Jebel Ali', expenseDate: new Date('2025-02-15T00:00:00Z') },
    { shipmentId: shipments[0].id, expenseType: 'dthc', vendorId: vendors[1].id, currency: 'AED', exchangeRate: 0.27, amount: 3700, tax: 185, amountBase: 999, taxBase: 49.95, paymentStatus: 'pending', invoiceNumber: 'INV-DTHC-25001', notes: 'Destination terminal handling charges', expenseDate: new Date('2025-02-28T00:00:00Z') },
    { shipmentId: shipments[0].id, expenseType: 'customs', vendorId: vendors[2].id, currency: 'AED', exchangeRate: 0.27, amount: 5500, tax: 275, amountBase: 1485, taxBase: 74.25, paymentStatus: 'pending', invoiceNumber: 'INV-CUS-25001', notes: 'Import customs clearance', expenseDate: new Date('2025-03-01T00:00:00Z') },

    // SHP-2025-0002
    { shipmentId: shipments[1].id, expenseType: 'ocean_freight', vendorId: vendors[0].id, currency: 'EUR', exchangeRate: 1.09, amount: 7800, tax: 390, amountBase: 8502, taxBase: 425.1, paymentStatus: 'paid', invoiceNumber: 'INV-OFR-25002', notes: 'Sea freight Hamburg to Jebel Ali', expenseDate: new Date('2025-01-20T00:00:00Z') },
    { shipmentId: shipments[1].id, expenseType: 'port_charges', vendorId: vendors[1].id, currency: 'AED', exchangeRate: 0.27, amount: 4200, tax: 210, amountBase: 1134, taxBase: 56.7, paymentStatus: 'partial', invoiceNumber: 'INV-PRT-25002', notes: 'Port charges at Jebel Ali', expenseDate: new Date('2025-02-18T00:00:00Z') },
    { shipmentId: shipments[1].id, expenseType: 'handling_charges', vendorId: vendors[5].id, currency: 'USD', exchangeRate: 1.0, amount: 1800, tax: 90, amountBase: 1800, taxBase: 90, paymentStatus: 'pending', invoiceNumber: 'INV-HDL-25002', notes: 'Cargo handling at terminal', expenseDate: new Date('2025-02-19T00:00:00Z') },

    // SHP-2025-0003
    { shipmentId: shipments[2].id, expenseType: 'ocean_freight', vendorId: vendors[0].id, currency: 'USD', exchangeRate: 1.0, amount: 12000, tax: 600, amountBase: 12000, taxBase: 600, paymentStatus: 'paid', invoiceNumber: 'INV-OFR-25003', notes: 'Reefer freight Mumbai to Jebel Ali', expenseDate: new Date('2025-01-05T00:00:00Z') },
    { shipmentId: shipments[2].id, expenseType: 'customs', vendorId: vendors[2].id, currency: 'AED', exchangeRate: 0.27, amount: 6800, tax: 340, amountBase: 1836, taxBase: 91.8, paymentStatus: 'paid', invoiceNumber: 'INV-CUS-25003', notes: 'Perishable goods customs clearance', expenseDate: new Date('2025-01-16T00:00:00Z') },

    // SHP-2025-0004
    { shipmentId: shipments[3].id, expenseType: 'ocean_freight', vendorId: vendors[0].id, currency: 'USD', exchangeRate: 1.0, amount: 9200, tax: 460, amountBase: 9200, taxBase: 460, paymentStatus: 'paid', invoiceNumber: 'INV-OFR-25004', notes: 'Hazardous cargo freight Shanghai to Jeddah', expenseDate: new Date('2025-02-01T00:00:00Z') },
    { shipmentId: shipments[3].id, expenseType: 'customs', vendorId: vendors[2].id, currency: 'AED', exchangeRate: 0.27, amount: 12000, tax: 600, amountBase: 3240, taxBase: 162, paymentStatus: 'pending', invoiceNumber: 'INV-CUS-25004', notes: 'Hazardous materials customs clearance - pending approval', expenseDate: new Date('2025-02-21T00:00:00Z') },
    { shipmentId: shipments[3].id, expenseType: 'port_charges', vendorId: vendors[5].id, currency: 'AED', exchangeRate: 0.27, amount: 5200, tax: 260, amountBase: 1404, taxBase: 70.2, paymentStatus: 'pending', invoiceNumber: 'INV-PRT-25004', notes: 'Jeddah port charges for hazmat', expenseDate: new Date('2025-02-22T00:00:00Z') },

    // SHP-2025-0005
    { shipmentId: shipments[4].id, expenseType: 'ocean_freight', vendorId: vendors[0].id, currency: 'USD', exchangeRate: 1.0, amount: 6800, tax: 340, amountBase: 6800, taxBase: 340, paymentStatus: 'pending', invoiceNumber: null, notes: 'Export freight Jebel Ali to Rotterdam', expenseDate: new Date('2025-03-15T00:00:00Z') },
    { shipmentId: shipments[4].id, expenseType: 'documentation', vendorId: vendors[0].id, currency: 'USD', exchangeRate: 1.0, amount: 350, tax: 17.5, amountBase: 350, taxBase: 17.5, paymentStatus: 'paid', invoiceNumber: 'INV-DOC-25005', notes: 'BL documentation and export clearance', expenseDate: new Date('2025-03-10T00:00:00Z') },

    // SHP-2025-0006
    { shipmentId: shipments[5].id, expenseType: 'ocean_freight', vendorId: vendors[0].id, currency: 'USD', exchangeRate: 1.0, amount: 7500, tax: 375, amountBase: 7500, taxBase: 375, paymentStatus: 'pending', invoiceNumber: null, notes: 'Export freight Jeddah to Hamburg', expenseDate: new Date('2025-03-10T00:00:00Z') },
    { shipmentId: shipments[5].id, expenseType: 'port_charges', vendorId: vendors[5].id, currency: 'AED', exchangeRate: 0.27, amount: 3800, tax: 190, amountBase: 1026, taxBase: 51.3, paymentStatus: 'pending', invoiceNumber: null, notes: 'Jeddah port loading charges', expenseDate: new Date('2025-03-08T00:00:00Z') },

    // SHP-2025-0007
    { shipmentId: shipments[6].id, expenseType: 'ocean_freight', vendorId: vendors[0].id, currency: 'USD', exchangeRate: 1.0, amount: 5600, tax: 280, amountBase: 5600, taxBase: 280, paymentStatus: 'paid', invoiceNumber: 'INV-OFR-25007', notes: 'Export freight Jebel Ali to Mumbai', expenseDate: new Date('2025-02-20T00:00:00Z') },
    { shipmentId: shipments[6].id, expenseType: 'handling_charges', vendorId: vendors[1].id, currency: 'AED', exchangeRate: 0.27, amount: 2800, tax: 140, amountBase: 756, taxBase: 37.8, paymentStatus: 'paid', invoiceNumber: 'INV-HDL-25007', notes: 'Export handling at Jebel Ali', expenseDate: new Date('2025-02-19T00:00:00Z') },

    // SHP-2025-0008
    { shipmentId: shipments[7].id, expenseType: 'ocean_freight', vendorId: vendors[3].id, currency: 'GBP', exchangeRate: 1.27, amount: 4200, tax: 210, amountBase: 5334, taxBase: 266.7, paymentStatus: 'paid', invoiceNumber: 'INV-AFR-25008', notes: 'Air freight London Heathrow to Dubai', expenseDate: new Date('2025-02-28T00:00:00Z') },
    { shipmentId: shipments[7].id, expenseType: 'customs', vendorId: vendors[2].id, currency: 'AED', exchangeRate: 0.27, amount: 3200, tax: 160, amountBase: 864, taxBase: 43.2, paymentStatus: 'partial', invoiceNumber: 'INV-CUS-25008', notes: 'Pharma customs clearance', expenseDate: new Date('2025-03-01T00:00:00Z') },

    // SHP-2025-0009
    { shipmentId: shipments[8].id, expenseType: 'ocean_freight', vendorId: vendors[3].id, currency: 'CNY', exchangeRate: 0.14, amount: 48000, tax: 2400, amountBase: 6720, taxBase: 336, paymentStatus: 'paid', invoiceNumber: 'INV-AFR-25009', notes: 'Air freight Beijing to Dubai', expenseDate: new Date('2025-02-10T00:00:00Z') },
    { shipmentId: shipments[8].id, expenseType: 'handling_charges', vendorId: vendors[1].id, currency: 'AED', exchangeRate: 0.27, amount: 1800, tax: 90, amountBase: 486, taxBase: 24.3, paymentStatus: 'paid', invoiceNumber: 'INV-HDL-25009', notes: 'Dubai Airport cargo handling', expenseDate: new Date('2025-02-12T00:00:00Z') },

    // SHP-2025-0010
    { shipmentId: shipments[9].id, expenseType: 'railways', vendorId: vendors[3].id, currency: 'AED', exchangeRate: 0.27, amount: 8500, tax: 425, amountBase: 2295, taxBase: 114.75, paymentStatus: 'partial', invoiceNumber: 'INV-TRK-25010', notes: 'Land transport Dubai to Riyadh', expenseDate: new Date('2025-02-27T00:00:00Z') },
    { shipmentId: shipments[9].id, expenseType: 'customs', vendorId: vendors[2].id, currency: 'AED', exchangeRate: 0.27, amount: 2400, tax: 120, amountBase: 648, taxBase: 32.4, paymentStatus: 'paid', invoiceNumber: 'INV-CUS-25010', notes: 'Saudi border customs', expenseDate: new Date('2025-02-28T00:00:00Z') },

    // SHP-2025-0011
    { shipmentId: shipments[10].id, expenseType: 'railways', vendorId: vendors[3].id, currency: 'AED', exchangeRate: 0.27, amount: 12000, tax: 600, amountBase: 3240, taxBase: 162, paymentStatus: 'paid', invoiceNumber: 'INV-TRK-25011', notes: 'Land transport Dubai to Muscat - oversized', expenseDate: new Date('2025-02-15T00:00:00Z') },
    { shipmentId: shipments[10].id, expenseType: 'fuel', vendorId: vendors[3].id, currency: 'AED', exchangeRate: 0.27, amount: 3500, tax: 175, amountBase: 945, taxBase: 47.25, paymentStatus: 'paid', invoiceNumber: 'INV-FL-25011', notes: 'Fuel surcharge for oversized load', expenseDate: new Date('2025-02-16T00:00:00Z') },
  ]

  const shipmentExpenses: Awaited<ReturnType<typeof prisma.shipmentExpense.create>>[] = []
  for (const data of shipmentExpensesData) {
    const expense = await prisma.shipmentExpense.create({ data })
    shipmentExpenses.push(expense)
  }
  console.log(`Created ${shipmentExpenses.length} shipment expenses`)

  // ============================================
  // 10. SHIPMENT REVENUES (1-2 per shipment)
  // ============================================
  const shipmentRevenuesData = [
    // SHP-2025-0001
    { shipmentId: shipments[0].id, customerId: customers[3].id, revenueType: 'freight_charges', currency: 'USD', exchangeRate: 1.0, amount: 14500, tax: 725, amountBase: 14500, taxBase: 725, dueDate: new Date('2025-03-15T00:00:00Z'), paymentStatus: 'pending', invoiceNumber: 'INV-RC-25001' },
    { shipmentId: shipments[0].id, customerId: customers[3].id, revenueType: 'handling_fees', currency: 'USD', exchangeRate: 1.0, amount: 2200, tax: 110, amountBase: 2200, taxBase: 110, dueDate: new Date('2025-03-15T00:00:00Z'), paymentStatus: 'paid', invoiceNumber: 'INV-RH-25001' },

    // SHP-2025-0002
    { shipmentId: shipments[1].id, customerId: customers[7].id, revenueType: 'freight_charges', currency: 'EUR', exchangeRate: 1.09, amount: 13200, tax: 660, amountBase: 14388, taxBase: 719.4, dueDate: new Date('2025-03-18T00:00:00Z'), paymentStatus: 'partial', invoiceNumber: 'INV-RC-25002' },

    // SHP-2025-0003
    { shipmentId: shipments[2].id, customerId: customers[0].id, revenueType: 'freight_charges', currency: 'USD', exchangeRate: 1.0, amount: 18500, tax: 925, amountBase: 18500, taxBase: 925, dueDate: new Date('2025-02-15T00:00:00Z'), paymentStatus: 'paid', invoiceNumber: 'INV-RC-25003' },
    { shipmentId: shipments[2].id, customerId: customers[0].id, revenueType: 'storage_charges', currency: 'USD', exchangeRate: 1.0, amount: 800, tax: 40, amountBase: 800, taxBase: 40, dueDate: new Date('2025-02-15T00:00:00Z'), paymentStatus: 'paid', invoiceNumber: 'INV-RS-25003' },

    // SHP-2025-0004
    { shipmentId: shipments[3].id, customerId: customers[4].id, revenueType: 'freight_charges', currency: 'USD', exchangeRate: 1.0, amount: 15800, tax: 790, amountBase: 15800, taxBase: 790, dueDate: new Date('2025-03-20T00:00:00Z'), paymentStatus: 'pending', invoiceNumber: 'INV-RC-25004' },
    { shipmentId: shipments[3].id, customerId: customers[4].id, revenueType: 'customs_charges', currency: 'AED', exchangeRate: 0.27, amount: 8500, tax: 425, amountBase: 2295, taxBase: 114.75, dueDate: new Date('2025-03-20T00:00:00Z'), paymentStatus: 'overdue', invoiceNumber: 'INV-RCC-25004' },

    // SHP-2025-0005
    { shipmentId: shipments[4].id, customerId: customers[5].id, revenueType: 'freight_charges', currency: 'USD', exchangeRate: 1.0, amount: 11200, tax: 560, amountBase: 11200, taxBase: 560, dueDate: new Date('2025-04-20T00:00:00Z'), paymentStatus: 'pending', invoiceNumber: null },

    // SHP-2025-0006
    { shipmentId: shipments[5].id, customerId: customers[6].id, revenueType: 'freight_charges', currency: 'USD', exchangeRate: 1.0, amount: 12500, tax: 625, amountBase: 12500, taxBase: 625, dueDate: new Date('2025-04-15T00:00:00Z'), paymentStatus: 'pending', invoiceNumber: null },
    { shipmentId: shipments[5].id, customerId: customers[6].id, revenueType: 'documentation_fees', currency: 'USD', exchangeRate: 1.0, amount: 450, tax: 22.5, amountBase: 450, taxBase: 22.5, dueDate: new Date('2025-04-15T00:00:00Z'), paymentStatus: 'paid', invoiceNumber: 'INV-RD-25006' },

    // SHP-2025-0007
    { shipmentId: shipments[6].id, customerId: customers[2].id, revenueType: 'freight_charges', currency: 'USD', exchangeRate: 1.0, amount: 9800, tax: 490, amountBase: 9800, taxBase: 490, dueDate: new Date('2025-03-15T00:00:00Z'), paymentStatus: 'paid', invoiceNumber: 'INV-RC-25007' },

    // SHP-2025-0008
    { shipmentId: shipments[7].id, customerId: customers[0].id, revenueType: 'freight_charges', currency: 'GBP', exchangeRate: 1.27, amount: 6800, tax: 340, amountBase: 8636, taxBase: 431.8, dueDate: new Date('2025-03-15T00:00:00Z'), paymentStatus: 'partial', invoiceNumber: 'INV-RC-25008' },
    { shipmentId: shipments[7].id, customerId: customers[0].id, revenueType: 'delivery_charges', currency: 'USD', exchangeRate: 1.0, amount: 1200, tax: 60, amountBase: 1200, taxBase: 60, dueDate: new Date('2025-03-15T00:00:00Z'), paymentStatus: 'paid', invoiceNumber: 'INV-RDL-25008' },

    // SHP-2025-0009
    { shipmentId: shipments[8].id, customerId: customers[3].id, revenueType: 'freight_charges', currency: 'USD', exchangeRate: 1.0, amount: 10200, tax: 510, amountBase: 10200, taxBase: 510, dueDate: new Date('2025-03-10T00:00:00Z'), paymentStatus: 'paid', invoiceNumber: 'INV-RC-25009' },

    // SHP-2025-0010
    { shipmentId: shipments[9].id, customerId: customers[6].id, revenueType: 'freight_charges', currency: 'AED', exchangeRate: 0.27, amount: 28000, tax: 1400, amountBase: 7560, taxBase: 378, dueDate: new Date('2025-03-15T00:00:00Z'), paymentStatus: 'pending', invoiceNumber: 'INV-RC-25010' },

    // SHP-2025-0011
    { shipmentId: shipments[10].id, customerId: customers[4].id, revenueType: 'freight_charges', currency: 'AED', exchangeRate: 0.27, amount: 35000, tax: 1750, amountBase: 9450, taxBase: 472.5, dueDate: new Date('2025-03-15T00:00:00Z'), paymentStatus: 'paid', invoiceNumber: 'INV-RC-25011' },
  ]

  const shipmentRevenues: Awaited<ReturnType<typeof prisma.shipmentRevenue.create>>[] = []
  for (const data of shipmentRevenuesData) {
    const revenue = await prisma.shipmentRevenue.create({ data })
    shipmentRevenues.push(revenue)
  }
  console.log(`Created ${shipmentRevenues.length} shipment revenues`)

  // ============================================
  // 11. VOYAGES
  // ============================================
  const voyagesData = [
    {
      voyageNumber: 'VOY-2025-0001',
      vesselName: 'Ever Given',
      sailingRoute: 'Asia-Middle East',
      departurePort: 'Shanghai',
      arrivalPort: 'Jebel Ali',
      etd: new Date('2025-02-15T00:00:00Z'),
      eta: new Date('2025-03-05T00:00:00Z'),
      shippingLine: 'Maersk Line',
      status: 'in_transit',
      remarks: 'Direct service Shanghai to Jebel Ali via Strait of Malacca',
    },
    {
      voyageNumber: 'VOY-2025-0002',
      vesselName: 'Maersk Elba',
      sailingRoute: 'Europe-Middle East',
      departurePort: 'Hamburg',
      arrivalPort: 'Jebel Ali',
      etd: new Date('2025-01-20T00:00:00Z'),
      eta: new Date('2025-02-18T00:00:00Z'),
      shippingLine: 'Maersk Line',
      status: 'completed',
      remarks: 'Europe-Middle East express service via Suez Canal',
    },
    {
      voyageNumber: 'VOY-2025-0003',
      vesselName: 'MSC Oscar',
      sailingRoute: 'Asia-Middle East',
      departurePort: 'Mumbai',
      arrivalPort: 'Jebel Ali',
      etd: new Date('2025-01-05T00:00:00Z'),
      eta: new Date('2025-01-15T00:00:00Z'),
      shippingLine: 'MSC',
      status: 'completed',
      remarks: 'India-Middle East feeder service',
    },
    {
      voyageNumber: 'VOY-2025-0004',
      vesselName: 'CMA CGM Marco Polo',
      sailingRoute: 'Asia-Europe',
      departurePort: 'Shanghai',
      arrivalPort: 'Hamburg',
      etd: new Date('2025-02-01T00:00:00Z'),
      eta: new Date('2025-03-01T00:00:00Z'),
      shippingLine: 'CMA CGM',
      status: 'in_transit',
      remarks: 'Asia-Europe main line via Suez Canal',
    },
    {
      voyageNumber: 'VOY-2025-0005',
      vesselName: 'Yang Ming Unity',
      sailingRoute: 'Middle East-Europe',
      departurePort: 'Jebel Ali',
      arrivalPort: 'Rotterdam',
      etd: new Date('2025-03-20T00:00:00Z'),
      eta: new Date('2025-04-15T00:00:00Z'),
      shippingLine: 'Yang Ming',
      status: 'planned',
      remarks: 'Middle East to Europe service - scheduled departure',
    },
    {
      voyageNumber: 'VOY-2025-0006',
      vesselName: 'HMM Copenhagen',
      sailingRoute: 'Asia-Europe',
      departurePort: 'Busan',
      arrivalPort: 'Hamburg',
      etd: new Date('2025-03-01T00:00:00Z'),
      eta: new Date('2025-03-28T00:00:00Z'),
      shippingLine: 'HMM',
      status: 'departed',
      remarks: 'Trans-Pacific to Europe via Suez',
    },
  ]

  const voyages: Awaited<ReturnType<typeof prisma.voyage.create>>[] = []
  for (const data of voyagesData) {
    const voyage = await prisma.voyage.create({ data })
    voyages.push(voyage)
  }
  console.log(`Created ${voyages.length} voyages`)

  // ============================================
  // 12. VOYAGE TEU RECORDS
  // ============================================
  const teuRecordsData = [
    // VOY-2025-0001 - Ever Given (in_transit)
    { voyageId: voyages[0].id, totalContainers: 5200, totalTEUs: 7800, loadedTEUs: 7020, emptyTEUs: 780, twentyFoot: 1200, fortyFoot: 3200, fortyFiveFoot: 180, reeferUnits: 420, specialUnits: 200, teuUtilization: (7020 / 7800) * 100, recordedAt: new Date('2025-02-16T00:00:00Z') },
    // VOY-2025-0002 - Maersk Elba (completed)
    { voyageId: voyages[1].id, totalContainers: 3800, totalTEUs: 5600, loadedTEUs: 5040, emptyTEUs: 560, twentyFoot: 900, fortyFoot: 2300, fortyFiveFoot: 120, reeferUnits: 350, specialUnits: 130, teuUtilization: (5040 / 5600) * 100, recordedAt: new Date('2025-01-21T00:00:00Z') },
    // VOY-2025-0003 - MSC Oscar (completed)
    { voyageId: voyages[2].id, totalContainers: 2400, totalTEUs: 3200, loadedTEUs: 2944, emptyTEUs: 256, twentyFoot: 650, fortyFoot: 1400, fortyFiveFoot: 80, reeferUnits: 180, specialUnits: 90, teuUtilization: (2944 / 3200) * 100, recordedAt: new Date('2025-01-06T00:00:00Z') },
    // VOY-2025-0004 - CMA CGM Marco Polo (in_transit)
    { voyageId: voyages[3].id, totalContainers: 6500, totalTEUs: 8500, loadedTEUs: 7650, emptyTEUs: 850, twentyFoot: 1500, fortyFoot: 3900, fortyFiveFoot: 280, reeferUnits: 520, specialUnits: 300, teuUtilization: (7650 / 8500) * 100, recordedAt: new Date('2025-02-02T00:00:00Z') },
    // VOY-2025-0005 - Yang Ming Unity (planned)
    { voyageId: voyages[4].id, totalContainers: 4200, totalTEUs: 6000, loadedTEUs: 4800, emptyTEUs: 1200, twentyFoot: 1100, fortyFoot: 2500, fortyFiveFoot: 150, reeferUnits: 300, specialUnits: 150, teuUtilization: (4800 / 6000) * 100, recordedAt: new Date('2025-03-15T00:00:00Z') },
    // VOY-2025-0006 - HMM Copenhagen (departed)
    { voyageId: voyages[5].id, totalContainers: 5800, totalTEUs: 7200, loadedTEUs: 6480, emptyTEUs: 720, twentyFoot: 1350, fortyFoot: 3400, fortyFiveFoot: 220, reeferUnits: 480, specialUnits: 250, teuUtilization: (6480 / 7200) * 100, recordedAt: new Date('2025-03-02T00:00:00Z') },
  ]

  const teuRecords: Awaited<ReturnType<typeof prisma.voyageTEU.create>>[] = []
  for (const data of teuRecordsData) {
    const record = await prisma.voyageTEU.create({ data })
    teuRecords.push(record)
  }
  console.log(`Created ${teuRecords.length} voyage TEU records`)

  // ============================================
  // 13. VOYAGE REVENUES (2 per voyage)
  // ============================================
  const voyageRevenuesData = [
    // VOY-2025-0001
    { voyageId: voyages[0].id, revenueType: 'freight_income', currency: 'USD', exchangeRate: 1.0, amount: 485000, amountBase: 485000, description: 'Main freight income - Asia to Middle East', invoiceNumber: 'VI-FR-25001', paymentStatus: 'partial', revenueDate: new Date('2025-02-15T00:00:00Z') },
    { voyageId: voyages[0].id, revenueType: 'surcharges', currency: 'USD', exchangeRate: 1.0, amount: 125000, amountBase: 125000, description: 'Fuel surcharge and peak season surcharge', invoiceNumber: 'VI-SR-25001', paymentStatus: 'pending', revenueDate: new Date('2025-02-15T00:00:00Z') },

    // VOY-2025-0002
    { voyageId: voyages[1].id, revenueType: 'freight_income', currency: 'EUR', exchangeRate: 1.09, amount: 380000, amountBase: 414200, description: 'Main freight income - Europe to Middle East', invoiceNumber: 'VI-FR-25002', paymentStatus: 'paid', revenueDate: new Date('2025-01-20T00:00:00Z') },
    { voyageId: voyages[1].id, revenueType: 'handling_income', currency: 'USD', exchangeRate: 1.0, amount: 85000, amountBase: 85000, description: 'Handling and terminal income', invoiceNumber: 'VI-HL-25002', paymentStatus: 'paid', revenueDate: new Date('2025-02-18T00:00:00Z') },

    // VOY-2025-0003
    { voyageId: voyages[2].id, revenueType: 'freight_income', currency: 'USD', exchangeRate: 1.0, amount: 220000, amountBase: 220000, description: 'Main freight income - India to Middle East', invoiceNumber: 'VI-FR-25003', paymentStatus: 'paid', revenueDate: new Date('2025-01-05T00:00:00Z') },
    { voyageId: voyages[2].id, revenueType: 'service_charges', currency: 'AED', exchangeRate: 0.27, amount: 180000, amountBase: 48600, description: 'Value-added service charges', invoiceNumber: 'VI-SC-25003', paymentStatus: 'paid', revenueDate: new Date('2025-01-15T00:00:00Z') },

    // VOY-2025-0004
    { voyageId: voyages[3].id, revenueType: 'freight_income', currency: 'USD', exchangeRate: 1.0, amount: 520000, amountBase: 520000, description: 'Main freight income - Asia to Europe', invoiceNumber: 'VI-FR-25004', paymentStatus: 'partial', revenueDate: new Date('2025-02-01T00:00:00Z') },
    { voyageId: voyages[3].id, revenueType: 'slot_revenue', currency: 'USD', exchangeRate: 1.0, amount: 180000, amountBase: 180000, description: 'Slot charter revenue from partners', invoiceNumber: 'VI-SL-25004', paymentStatus: 'pending', revenueDate: new Date('2025-02-05T00:00:00Z') },

    // VOY-2025-0005
    { voyageId: voyages[4].id, revenueType: 'freight_income', currency: 'USD', exchangeRate: 1.0, amount: 350000, amountBase: 350000, description: 'Main freight income - Middle East to Europe', invoiceNumber: null, paymentStatus: 'pending', revenueDate: new Date('2025-03-20T00:00:00Z') },
    { voyageId: voyages[4].id, revenueType: 'surcharges', currency: 'USD', exchangeRate: 1.0, amount: 95000, amountBase: 95000, description: 'Bunker and canal surcharges', invoiceNumber: null, paymentStatus: 'pending', revenueDate: new Date('2025-03-20T00:00:00Z') },

    // VOY-2025-0006
    { voyageId: voyages[5].id, revenueType: 'freight_income', currency: 'USD', exchangeRate: 1.0, amount: 465000, amountBase: 465000, description: 'Main freight income - Asia to Europe', invoiceNumber: 'VI-FR-25006', paymentStatus: 'partial', revenueDate: new Date('2025-03-01T00:00:00Z') },
    { voyageId: voyages[5].id, revenueType: 'handling_income', currency: 'USD', exchangeRate: 1.0, amount: 72000, amountBase: 72000, description: 'Handling and port service income', invoiceNumber: 'VI-HL-25006', paymentStatus: 'pending', revenueDate: new Date('2025-03-05T00:00:00Z') },
  ]

  const voyageRevenues: Awaited<ReturnType<typeof prisma.voyageRevenue.create>>[] = []
  for (const data of voyageRevenuesData) {
    const revenue = await prisma.voyageRevenue.create({ data })
    voyageRevenues.push(revenue)
  }
  console.log(`Created ${voyageRevenues.length} voyage revenues`)

  // ============================================
  // 14. VOYAGE EXPENSES (3 per voyage)
  // ============================================
  const voyageExpensesData = [
    // VOY-2025-0001
    { voyageId: voyages[0].id, expenseType: 'ocean_freight', vendorId: vendors[0].id, currency: 'USD', exchangeRate: 1.0, amount: 195000, amountBase: 195000, description: 'Vessel charter and fuel costs', invoiceNumber: 'VE-OF-25001', paymentStatus: 'paid', expenseDate: new Date('2025-02-15T00:00:00Z') },
    { voyageId: voyages[0].id, expenseType: 'port_charges', vendorId: vendors[1].id, currency: 'AED', exchangeRate: 0.27, amount: 850000, amountBase: 229500, description: 'Jebel Ali port charges and pilotage', invoiceNumber: 'VE-PC-25001', paymentStatus: 'partial', expenseDate: new Date('2025-03-04T00:00:00Z') },
    { voyageId: voyages[0].id, expenseType: 'bunker_costs', vendorId: vendors[0].id, currency: 'USD', exchangeRate: 1.0, amount: 142000, amountBase: 142000, description: 'Bunker fuel for voyage', invoiceNumber: 'VE-BC-25001', paymentStatus: 'paid', expenseDate: new Date('2025-02-14T00:00:00Z') },

    // VOY-2025-0002
    { voyageId: voyages[1].id, expenseType: 'ocean_freight', vendorId: vendors[0].id, currency: 'EUR', exchangeRate: 1.09, amount: 165000, amountBase: 179850, description: 'Vessel operating costs', invoiceNumber: 'VE-OF-25002', paymentStatus: 'paid', expenseDate: new Date('2025-01-20T00:00:00Z') },
    { voyageId: voyages[1].id, expenseType: 'canal_fees', vendorId: vendors[0].id, currency: 'USD', exchangeRate: 1.0, amount: 125000, amountBase: 125000, description: 'Suez Canal transit fees', invoiceNumber: 'VE-CF-25002', paymentStatus: 'paid', expenseDate: new Date('2025-02-01T00:00:00Z') },
    { voyageId: voyages[1].id, expenseType: 'terminal_handling', vendorId: vendors[1].id, currency: 'AED', exchangeRate: 0.27, amount: 620000, amountBase: 167400, description: 'Terminal handling at Jebel Ali', invoiceNumber: 'VE-TH-25002', paymentStatus: 'paid', expenseDate: new Date('2025-02-18T00:00:00Z') },

    // VOY-2025-0003
    { voyageId: voyages[2].id, expenseType: 'ocean_freight', vendorId: vendors[0].id, currency: 'USD', exchangeRate: 1.0, amount: 98000, amountBase: 98000, description: 'Feeder vessel operating costs', invoiceNumber: 'VE-OF-25003', paymentStatus: 'paid', expenseDate: new Date('2025-01-05T00:00:00Z') },
    { voyageId: voyages[2].id, expenseType: 'port_charges', vendorId: vendors[1].id, currency: 'AED', exchangeRate: 0.27, amount: 380000, amountBase: 102600, description: 'Jebel Ali port charges', invoiceNumber: 'VE-PC-25003', paymentStatus: 'paid', expenseDate: new Date('2025-01-15T00:00:00Z') },
    { voyageId: voyages[2].id, expenseType: 'agency_costs', vendorId: vendors[2].id, currency: 'AED', exchangeRate: 0.27, amount: 95000, amountBase: 25650, description: 'Local agency and customs fees', invoiceNumber: 'VE-AC-25003', paymentStatus: 'paid', expenseDate: new Date('2025-01-16T00:00:00Z') },

    // VOY-2025-0004
    { voyageId: voyages[3].id, expenseType: 'ocean_freight', vendorId: vendors[0].id, currency: 'USD', exchangeRate: 1.0, amount: 245000, amountBase: 245000, description: 'Main line vessel charter', invoiceNumber: 'VE-OF-25004', paymentStatus: 'partial', expenseDate: new Date('2025-02-01T00:00:00Z') },
    { voyageId: voyages[3].id, expenseType: 'fuel_costs', vendorId: vendors[0].id, currency: 'USD', exchangeRate: 1.0, amount: 178000, amountBase: 178000, description: 'VLSFO and LSMGO fuel costs', invoiceNumber: 'VE-FC-25004', paymentStatus: 'paid', expenseDate: new Date('2025-02-10T00:00:00Z') },
    { voyageId: voyages[3].id, expenseType: 'canal_fees', vendorId: vendors[0].id, currency: 'USD', exchangeRate: 1.0, amount: 135000, amountBase: 135000, description: 'Suez Canal transit and surcharges', invoiceNumber: 'VE-CF-25004', paymentStatus: 'pending', expenseDate: new Date('2025-02-15T00:00:00Z') },

    // VOY-2025-0005
    { voyageId: voyages[4].id, expenseType: 'ocean_freight', vendorId: vendors[0].id, currency: 'USD', exchangeRate: 1.0, amount: 165000, amountBase: 165000, description: 'Planned vessel charter cost', invoiceNumber: null, paymentStatus: 'pending', expenseDate: new Date('2025-03-20T00:00:00Z') },
    { voyageId: voyages[4].id, expenseType: 'port_charges', vendorId: vendors[1].id, currency: 'AED', exchangeRate: 0.27, amount: 580000, amountBase: 156600, description: 'Planned Jebel Ali departure charges', invoiceNumber: null, paymentStatus: 'pending', expenseDate: new Date('2025-03-19T00:00:00Z') },
    { voyageId: voyages[4].id, expenseType: 'documentation', vendorId: vendors[2].id, currency: 'USD', exchangeRate: 1.0, amount: 28000, amountBase: 28000, description: 'Documentation and manifest costs', invoiceNumber: null, paymentStatus: 'pending', expenseDate: new Date('2025-03-18T00:00:00Z') },

    // VOY-2025-0006
    { voyageId: voyages[5].id, expenseType: 'ocean_freight', vendorId: vendors[0].id, currency: 'USD', exchangeRate: 1.0, amount: 210000, amountBase: 210000, description: 'Vessel charter for Asia-Europe run', invoiceNumber: 'VE-OF-25006', paymentStatus: 'partial', expenseDate: new Date('2025-03-01T00:00:00Z') },
    { voyageId: voyages[5].id, expenseType: 'bunker_costs', vendorId: vendors[0].id, currency: 'USD', exchangeRate: 1.0, amount: 155000, amountBase: 155000, description: 'Bunker fuel costs', invoiceNumber: 'VE-BC-25006', paymentStatus: 'pending', expenseDate: new Date('2025-03-05T00:00:00Z') },
    { voyageId: voyages[5].id, expenseType: 'terminal_handling', vendorId: vendors[5].id, currency: 'EUR', exchangeRate: 1.09, amount: 95000, amountBase: 103550, description: 'Hamburg terminal handling charges', invoiceNumber: 'VE-TH-25006', paymentStatus: 'pending', expenseDate: new Date('2025-03-25T00:00:00Z') },
  ]

  const voyageExpenses: Awaited<ReturnType<typeof prisma.voyageExpense.create>>[] = []
  for (const data of voyageExpensesData) {
    const expense = await prisma.voyageExpense.create({ data })
    voyageExpenses.push(expense)
  }
  console.log(`Created ${voyageExpenses.length} voyage expenses`)

  // ============================================
  // 15. INVOICES
  // ============================================
  const invoicesData = [
    // Receivable - paid
    {
      invoiceNumber: 'AR-2025-0001',
      type: 'receivable',
      entityType: 'shipment',
      entityId: shipments[2].id,
      customerId: customers[0].id,
      vendorId: null,
      currency: 'USD',
      exchangeRate: 1.0,
      subtotal: 19300,
      taxAmount: 965,
      totalAmount: 20265,
      totalBase: 20265,
      dueDate: new Date('2025-02-15T00:00:00Z'),
      status: 'paid',
      notes: 'Freight and storage charges for SHP-2025-0003',
    },
    // Receivable - partial
    {
      invoiceNumber: 'AR-2025-0002',
      type: 'receivable',
      entityType: 'shipment',
      entityId: shipments[1].id,
      customerId: customers[7].id,
      vendorId: null,
      currency: 'EUR',
      exchangeRate: 1.09,
      subtotal: 13200,
      taxAmount: 660,
      totalAmount: 13860,
      totalBase: 15107.4,
      dueDate: new Date('2025-03-18T00:00:00Z'),
      status: 'partial',
      notes: 'Freight charges for SHP-2025-0002',
    },
    // Receivable - pending
    {
      invoiceNumber: 'AR-2025-0003',
      type: 'receivable',
      entityType: 'shipment',
      entityId: shipments[0].id,
      customerId: customers[3].id,
      vendorId: null,
      currency: 'USD',
      exchangeRate: 1.0,
      subtotal: 16700,
      taxAmount: 835,
      totalAmount: 17535,
      totalBase: 17535,
      dueDate: new Date('2025-03-15T00:00:00Z'),
      status: 'pending',
      notes: 'Freight and handling charges for SHP-2025-0001',
    },
    // Receivable - overdue
    {
      invoiceNumber: 'AR-2025-0004',
      type: 'receivable',
      entityType: 'shipment',
      entityId: shipments[3].id,
      customerId: customers[4].id,
      vendorId: null,
      currency: 'USD',
      exchangeRate: 1.0,
      subtotal: 24300,
      taxAmount: 1215,
      totalAmount: 25515,
      totalBase: 25515,
      dueDate: new Date('2025-02-15T00:00:00Z'),
      status: 'overdue',
      notes: 'Freight and customs charges for SHP-2025-0004 - overdue',
    },
    // Payable - paid
    {
      invoiceNumber: 'AP-2025-0001',
      type: 'payable',
      entityType: 'shipment',
      entityId: shipments[2].id,
      customerId: null,
      vendorId: vendors[0].id,
      currency: 'USD',
      exchangeRate: 1.0,
      subtotal: 12600,
      taxAmount: 630,
      totalAmount: 13230,
      totalBase: 13230,
      dueDate: new Date('2025-02-10T00:00:00Z'),
      status: 'paid',
      notes: 'Ocean freight and customs for SHP-2025-0003',
    },
    // Payable - pending
    {
      invoiceNumber: 'AP-2025-0002',
      type: 'payable',
      entityType: 'shipment',
      entityId: shipments[0].id,
      customerId: null,
      vendorId: vendors[1].id,
      currency: 'AED',
      exchangeRate: 0.27,
      subtotal: 9200,
      taxAmount: 460,
      totalAmount: 9660,
      totalBase: 2608.2,
      dueDate: new Date('2025-03-20T00:00:00Z'),
      status: 'pending',
      notes: 'DTHC and customs for SHP-2025-0001',
    },
    // Payable - partial (voyage)
    {
      invoiceNumber: 'AP-2025-0003',
      type: 'payable',
      entityType: 'voyage',
      entityId: voyages[3].id,
      customerId: null,
      vendorId: vendors[0].id,
      currency: 'USD',
      exchangeRate: 1.0,
      subtotal: 423000,
      taxAmount: 21150,
      totalAmount: 444150,
      totalBase: 444150,
      dueDate: new Date('2025-04-01T00:00:00Z'),
      status: 'partial',
      notes: 'Voyage expenses for VOY-2025-0004',
    },
    // Receivable - paid (voyage)
    {
      invoiceNumber: 'AR-2025-0005',
      type: 'receivable',
      entityType: 'voyage',
      entityId: voyages[1].id,
      customerId: customers[2].id,
      vendorId: null,
      currency: 'EUR',
      exchangeRate: 1.09,
      subtotal: 380000,
      taxAmount: 19000,
      totalAmount: 399000,
      totalBase: 434910,
      dueDate: new Date('2025-03-01T00:00:00Z'),
      status: 'paid',
      notes: 'Freight income for VOY-2025-0002',
    },
  ]

  const invoices: Awaited<ReturnType<typeof prisma.invoice.create>>[] = []
  for (const data of invoicesData) {
    const invoice = await prisma.invoice.create({ data })
    invoices.push(invoice)
  }
  console.log(`Created ${invoices.length} invoices`)

  // ============================================
  // 16. PAYMENTS
  // ============================================
  const paymentsData = [
    {
      invoiceId: invoices[0].id, // AR-2025-0001 (paid)
      amount: 20265,
      currency: 'USD',
      exchangeRate: 1.0,
      amountBase: 20265,
      paymentMethod: 'bank_transfer',
      reference: 'WIRE-2025-0215',
      paymentDate: new Date('2025-02-15T00:00:00Z'),
      notes: 'Full payment received for AR-2025-0001',
    },
    {
      invoiceId: invoices[1].id, // AR-2025-0002 (partial)
      amount: 7500,
      currency: 'EUR',
      exchangeRate: 1.09,
      amountBase: 8175,
      paymentMethod: 'bank_transfer',
      reference: 'SEPA-2025-0301',
      paymentDate: new Date('2025-03-01T00:00:00Z'),
      notes: 'Partial payment for AR-2025-0002',
    },
    {
      invoiceId: invoices[4].id, // AP-2025-0001 (paid)
      amount: 13230,
      currency: 'USD',
      exchangeRate: 1.0,
      amountBase: 13230,
      paymentMethod: 'bank_transfer',
      reference: 'ACH-2025-0210',
      paymentDate: new Date('2025-02-10T00:00:00Z'),
      notes: 'Payment to Maersk for AP-2025-0001',
    },
    {
      invoiceId: invoices[7].id, // AR-2025-0005 (paid)
      amount: 399000,
      currency: 'EUR',
      exchangeRate: 1.09,
      amountBase: 434910,
      paymentMethod: 'bank_transfer',
      reference: 'SEPA-2025-0228',
      paymentDate: new Date('2025-02-28T00:00:00Z'),
      notes: 'Full voyage payment for AR-2025-0005',
    },
    {
      invoiceId: invoices[6].id, // AP-2025-0003 (partial)
      amount: 200000,
      currency: 'USD',
      exchangeRate: 1.0,
      amountBase: 200000,
      paymentMethod: 'bank_transfer',
      reference: 'WIRE-2025-0305',
      paymentDate: new Date('2025-03-05T00:00:00Z'),
      notes: 'Partial voyage payment for AP-2025-0003',
    },
    {
      invoiceId: invoices[3].id, // AR-2025-0004 (overdue - small partial payment)
      amount: 5000,
      currency: 'USD',
      exchangeRate: 1.0,
      amountBase: 5000,
      paymentMethod: 'check',
      reference: 'CHK-2025-0215',
      paymentDate: new Date('2025-02-15T00:00:00Z'),
      notes: 'Partial payment received - overdue balance remaining',
    },
  ]

  const payments: Awaited<ReturnType<typeof prisma.payment.create>>[] = []
  for (const data of paymentsData) {
    const payment = await prisma.payment.create({ data })
    payments.push(payment)
  }
  console.log(`Created ${payments.length} payments`)

  // ============================================
  // 17. NOTIFICATIONS
  // ============================================
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: adminUser.id,
        title: 'Shipment Arrived',
        message: 'SHP-2025-0002 has arrived at Jebel Ali Port. Please arrange customs clearance and delivery.',
        type: 'success',
        isRead: true,
        link: '/shipments?id=' + shipments[1].id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: adminUser.id,
        title: 'Customs Clearance Required',
        message: 'SHP-2025-0004 is pending customs clearance at Jeddah Port. Hazardous cargo documentation needs review.',
        type: 'warning',
        isRead: false,
        link: '/shipments?id=' + shipments[3].id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: adminUser.id,
        title: 'Payment Overdue',
        message: 'Invoice AR-2025-0004 for Global Trading Corp is overdue by 15 days. Total outstanding: $20,515.',
        type: 'warning',
        isRead: false,
        link: '/finance?tab=ar',
      },
    }),
    prisma.notification.create({
      data: {
        userId: adminUser.id,
        title: 'Voyage Completed',
        message: 'VOY-2025-0002 (Maersk Elba) has completed its Europe-Middle East route. All cargo discharged at Jebel Ali.',
        type: 'success',
        isRead: true,
        link: '/voyages?id=' + voyages[1].id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: adminUser.id,
        title: 'New Booking Confirmation',
        message: 'SHP-2025-0005 has been booked on Maersk Elba departing March 15. Booking ref: BK-SH-2025005.',
        type: 'info',
        isRead: false,
        link: '/shipments?id=' + shipments[4].id,
      },
    }),
  ])
  console.log(`Created ${notifications.length} notifications`)

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n========================================')
  console.log('  SEED DATA SUMMARY')
  console.log('========================================')
  console.log(`  Users:           1`)
  console.log(`  Company Profile: 1`)
  console.log(`  Currencies:      ${currencies.length}`)
  console.log(`  Exchange Rates:  ${exchangeRates.length}`)
  console.log(`  Customers:       ${customers.length}`)
  console.log(`  Vendors:         ${vendors.length}`)
  console.log(`  Shipments:       ${shipments.length}`)
  console.log(`  Containers:      ${containers.length}`)
  console.log(`  Shipment Expenses: ${shipmentExpenses.length}`)
  console.log(`  Shipment Revenues: ${shipmentRevenues.length}`)
  console.log(`  Voyages:         ${voyages.length}`)
  console.log(`  Voyage TEUs:     ${teuRecords.length}`)
  console.log(`  Voyage Revenues: ${voyageRevenues.length}`)
  console.log(`  Voyage Expenses: ${voyageExpenses.length}`)
  console.log(`  Invoices:        ${invoices.length}`)
  console.log(`  Payments:        ${payments.length}`)
  console.log(`  Notifications:   ${notifications.length}`)
  console.log('========================================')
  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
