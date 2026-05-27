'use client'

import React from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { ERPSidebar } from '@/components/erp/sidebar'
import { ERPHeader } from '@/components/erp/header'
import { DashboardPage } from '@/components/erp/dashboard/dashboard-page'
import { PlaceholderPage, pageConfigMap } from '@/components/erp/placeholder-page'
import { ShipmentsList } from '@/components/erp/shipment/shipments-list'
import { ShipmentDetail } from '@/components/erp/shipment/shipment-detail'
import { ContainerTracking } from '@/components/erp/shipment/container-tracking'
import { ShipmentExpensesOverview } from '@/components/erp/shipment/shipment-expenses-overview'
import { ShipmentRevenueOverview } from '@/components/erp/shipment/shipment-revenue-overview'
import { ShipmentProfitability } from '@/components/erp/shipment/shipment-profitability'
import { ShipmentReports } from '@/components/erp/shipment/shipment-reports'
import { VoyagesList } from '@/components/erp/voyage/voyages-list'
import { VoyageDetail } from '@/components/erp/voyage/voyage-detail'
import { VoyageTeuOverview } from '@/components/erp/voyage/voyage-teu-overview'
import { VoyageRevenueOverview } from '@/components/erp/voyage/voyage-revenue-overview'
import { VoyageExpensesOverview } from '@/components/erp/voyage/voyage-expenses-overview'
import { VoyageProfitability } from '@/components/erp/voyage/voyage-profitability'
import { VoyageReports } from '@/components/erp/voyage/voyage-reports'
import { DocumentsPage } from '@/components/erp/documents/documents-page'
import { AnalyticsPage } from '@/components/erp/analytics/analytics-page'
import { SettingsPage } from '@/components/erp/settings/settings-page'
import { AccountsReceivable } from '@/components/erp/finance/accounts-receivable'
import { AccountsPayable } from '@/components/erp/finance/accounts-payable'
import { InvoicesPage } from '@/components/erp/finance/invoices-page'
import { PaymentsPage } from '@/components/erp/finance/payments-page'
import { useNavigationStore } from '@/lib/store'

function PageContent() {
  const { currentPage } = useNavigationStore()

  if (currentPage === 'dashboard') {
    return <DashboardPage />
  }

  // Shipment Operations Module
  if (currentPage === 'shipments') {
    return <ShipmentsList />
  }
  if (currentPage === 'shipment-detail') {
    return <ShipmentDetail />
  }
  if (currentPage === 'container-tracking') {
    return <ContainerTracking />
  }
  if (currentPage === 'shipment-expenses') {
    return <ShipmentExpensesOverview />
  }
  if (currentPage === 'shipment-revenue') {
    return <ShipmentRevenueOverview />
  }
  if (currentPage === 'shipment-profitability') {
    return <ShipmentProfitability />
  }
  if (currentPage === 'shipment-reports') {
    return <ShipmentReports />
  }

  // Voyage Finance Module
  if (currentPage === 'voyage') {
    return <VoyagesList />
  }
  if (currentPage === 'voyage-detail') {
    return <VoyageDetail />
  }
  if (currentPage === 'voyage-teu') {
    return <VoyageTeuOverview />
  }
  if (currentPage === 'voyage-revenue') {
    return <VoyageRevenueOverview />
  }
  if (currentPage === 'voyage-expenses') {
    return <VoyageExpensesOverview />
  }
  if (currentPage === 'voyage-profitability') {
    return <VoyageProfitability />
  }
  if (currentPage === 'voyage-reports') {
    return <VoyageReports />
  }

  // Documents Module
  if (currentPage === 'documents') {
    return <DocumentsPage />
  }

  // Analytics & BI Module
  if (currentPage === 'analytics') {
    return <AnalyticsPage />
  }

  // Settings Module
  if (currentPage === 'settings') {
    return <SettingsPage />
  }

  // Financial Management Module
  if (currentPage === 'finance-receivable') {
    return <AccountsReceivable />
  }
  if (currentPage === 'finance-payable') {
    return <AccountsPayable />
  }
  if (currentPage === 'finance-invoices') {
    return <InvoicesPage />
  }
  if (currentPage === 'finance-payments') {
    return <PaymentsPage />
  }

  // Placeholder for other pages
  const config = pageConfigMap[currentPage]
  if (config && config.title) {
    return (
      <PlaceholderPage
        title={config.title}
        description={config.description}
        icon={config.icon}
        accentColor={config.accentColor}
      />
    )
  }

  return <DashboardPage />
}

export default function Home() {
  return (
    <SidebarProvider>
      <ERPSidebar />
      <SidebarInset>
        <ERPHeader />
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            <PageContent />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
