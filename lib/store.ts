/**
 * Global application state managed with Zustand.
 *
 * Provides sidebar collapse state, theme preference, and modal management.
 * Sidebar collapse state is persisted to localStorage so it survives page
 * refreshes. Theme and modal state are intentionally transient.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface AppState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  theme: Theme
  setTheme: (theme: Theme) => void

  activeModal: string | null
  openModal: (id: string) => void
  closeModal: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      theme: 'system',
      setTheme: (theme) => set({ theme }),

      activeModal: null,
      openModal: (id) => set({ activeModal: id }),
      closeModal: () => set({ activeModal: null }),
    }),
    {
      name: 'app-store',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
)
