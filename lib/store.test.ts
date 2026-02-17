import { useAppStore } from './store'

describe('useAppStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppStore.setState({
      sidebarCollapsed: false,
      theme: 'system',
      activeModal: null,
    })
  })

  describe('sidebar', () => {
    it('starts expanded', () => {
      expect(useAppStore.getState().sidebarCollapsed).toBe(false)
    })

    it('toggles to collapsed', () => {
      useAppStore.getState().toggleSidebar()
      expect(useAppStore.getState().sidebarCollapsed).toBe(true)
    })

    it('toggles back to expanded', () => {
      useAppStore.getState().toggleSidebar()
      useAppStore.getState().toggleSidebar()
      expect(useAppStore.getState().sidebarCollapsed).toBe(false)
    })
  })

  describe('theme', () => {
    it('defaults to "system"', () => {
      expect(useAppStore.getState().theme).toBe('system')
    })

    it('sets to "dark"', () => {
      useAppStore.getState().setTheme('dark')
      expect(useAppStore.getState().theme).toBe('dark')
    })

    it('sets to "light"', () => {
      useAppStore.getState().setTheme('light')
      expect(useAppStore.getState().theme).toBe('light')
    })
  })

  describe('modal', () => {
    it('starts with no active modal', () => {
      expect(useAppStore.getState().activeModal).toBeNull()
    })

    it('opens a modal', () => {
      useAppStore.getState().openModal('confirm-delete')
      expect(useAppStore.getState().activeModal).toBe('confirm-delete')
    })

    it('closes a modal', () => {
      useAppStore.getState().openModal('confirm-delete')
      useAppStore.getState().closeModal()
      expect(useAppStore.getState().activeModal).toBeNull()
    })
  })
})
