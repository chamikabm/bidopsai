import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUIStore } from '../ui-store'

describe('UI Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useUIStore())
    act(() => {
      result.current.setTheme('futuristic')
      result.current.setLanguage('en-US')
      result.current.setSidebarCollapsed(false)
      result.current.setMobileMenuOpen(false)
    })
  })

  describe('Theme Management', () => {
    it('has default theme', () => {
      const { result } = renderHook(() => useUIStore())
      expect(result.current.theme).toBe('futuristic')
    })

    it('updates theme', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.setTheme('dark')
      })
      
      expect(result.current.theme).toBe('dark')
    })

    it('supports all theme options', () => {
      const { result } = renderHook(() => useUIStore())
      const themes = ['light', 'dark', 'deloitte', 'futuristic'] as const
      
      themes.forEach((theme) => {
        act(() => {
          result.current.setTheme(theme)
        })
        expect(result.current.theme).toBe(theme)
      })
    })
  })

  describe('Language Management', () => {
    it('has default language', () => {
      const { result } = renderHook(() => useUIStore())
      expect(result.current.language).toBe('en-US')
    })

    it('updates language', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.setLanguage('en-AU')
      })
      
      expect(result.current.language).toBe('en-AU')
    })
  })

  describe('Sidebar State', () => {
    it('sidebar is not collapsed by default', () => {
      const { result } = renderHook(() => useUIStore())
      expect(result.current.sidebarCollapsed).toBe(false)
    })

    it('toggles sidebar', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.toggleSidebar()
      })
      
      expect(result.current.sidebarCollapsed).toBe(true)
      
      act(() => {
        result.current.toggleSidebar()
      })
      
      expect(result.current.sidebarCollapsed).toBe(false)
    })

    it('sets sidebar collapsed state', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.setSidebarCollapsed(true)
      })
      
      expect(result.current.sidebarCollapsed).toBe(true)
    })
  })

  describe('Mobile Menu State', () => {
    it('mobile menu is closed by default', () => {
      const { result } = renderHook(() => useUIStore())
      expect(result.current.mobileMenuOpen).toBe(false)
    })

    it('toggles mobile menu', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.toggleMobileMenu()
      })
      
      expect(result.current.mobileMenuOpen).toBe(true)
      
      act(() => {
        result.current.toggleMobileMenu()
      })
      
      expect(result.current.mobileMenuOpen).toBe(false)
    })

    it('sets mobile menu open state', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.setMobileMenuOpen(true)
      })
      
      expect(result.current.mobileMenuOpen).toBe(true)
    })
  })

  describe('Modal Management', () => {
    it('has no modals open by default', () => {
      const { result } = renderHook(() => useUIStore())
      expect(result.current.modals).toEqual({})
    })

    it('opens modal', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.openModal('test-modal')
      })
      
      expect(result.current.modals['test-modal']).toBe(true)
    })

    it('closes modal', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.openModal('test-modal')
        result.current.closeModal('test-modal')
      })
      
      expect(result.current.modals['test-modal']).toBe(false)
    })

    it('toggles modal', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.toggleModal('test-modal')
      })
      
      expect(result.current.modals['test-modal']).toBe(true)
      
      act(() => {
        result.current.toggleModal('test-modal')
      })
      
      expect(result.current.modals['test-modal']).toBe(false)
    })

    it('manages multiple modals independently', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.openModal('modal1')
        result.current.openModal('modal2')
      })
      
      expect(result.current.modals['modal1']).toBe(true)
      expect(result.current.modals['modal2']).toBe(true)
      
      act(() => {
        result.current.closeModal('modal1')
      })
      
      expect(result.current.modals['modal1']).toBe(false)
      expect(result.current.modals['modal2']).toBe(true)
    })
  })

  describe('Loading States', () => {
    it('has no loading states by default', () => {
      const { result } = renderHook(() => useUIStore())
      expect(result.current.loadingStates).toEqual({})
    })

    it('sets loading state', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.setLoading('test-operation', true)
      })
      
      expect(result.current.loadingStates['test-operation']).toBe(true)
    })

    it('clears loading state', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.setLoading('test-operation', true)
        result.current.setLoading('test-operation', false)
      })
      
      expect(result.current.loadingStates['test-operation']).toBe(false)
    })

    it('manages multiple loading states independently', () => {
      const { result } = renderHook(() => useUIStore())
      
      act(() => {
        result.current.setLoading('operation1', true)
        result.current.setLoading('operation2', true)
      })
      
      expect(result.current.loadingStates['operation1']).toBe(true)
      expect(result.current.loadingStates['operation2']).toBe(true)
      
      act(() => {
        result.current.setLoading('operation1', false)
      })
      
      expect(result.current.loadingStates['operation1']).toBe(false)
      expect(result.current.loadingStates['operation2']).toBe(true)
    })
  })
})
