'use client'

import { create } from 'zustand'

export type PageId =
  | 'dashboard'
  | 'summary'
  | 'shipments'
  | 'shipment-detail'
  | 'container-tracking'
  | 'shipment-expenses'
  | 'shipment-revenue'
  | 'shipment-profitability'
  | 'shipment-reports'
  | 'voyage'
  | 'voyage-detail'
  | 'voyage-teu'
  | 'voyage-revenue'
  | 'voyage-expenses'
  | 'voyage-profitability'
  | 'voyage-reports'
  | 'finance'
  | 'finance-receivable'
  | 'finance-payable'
  | 'finance-invoices'
  | 'finance-payments'
  | 'documents'
  | 'analytics'
  | 'settings'
  | 'forecast'

interface NavigationState {
  currentPage: PageId
  currentSubPage: string
  selectedShipmentId: string | null
  selectedVoyageId: string | null
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  navigationHistory: PageId[]

  navigateTo: (page: PageId, subPage?: string) => void
  selectShipment: (id: string) => void
  selectVoyage: (id: string) => void
  goBack: () => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentPage: 'dashboard',
  currentSubPage: '',
  selectedShipmentId: null,
  selectedVoyageId: null,
  sidebarOpen: true,
  theme: 'light',
  navigationHistory: ['dashboard'],

  navigateTo: (page, subPage = '') => {
    const { currentPage, navigationHistory } = get()
    if (currentPage !== page) {
      set({
        currentPage: page,
        currentSubPage: subPage,
        navigationHistory: [...navigationHistory, page],
      })
    } else if (subPage) {
      set({ currentSubPage: subPage })
    }
  },

  selectShipment: (id) => {
    set({
      selectedShipmentId: id,
      currentPage: 'shipment-detail',
      navigationHistory: [...get().navigationHistory, 'shipment-detail'],
    })
  },

  selectVoyage: (id) => {
    set({
      selectedVoyageId: id,
      currentPage: 'voyage-detail',
      navigationHistory: [...get().navigationHistory, 'voyage-detail'],
    })
  },

  goBack: () => {
    const { navigationHistory } = get()
    if (navigationHistory.length > 1) {
      const newHistory = navigationHistory.slice(0, -1)
      const previousPage = newHistory[newHistory.length - 1]
      set({
        currentPage: previousPage,
        navigationHistory: newHistory,
      })
    }
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setTheme: (theme) => set({ theme }),
}))
