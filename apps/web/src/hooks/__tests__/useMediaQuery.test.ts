import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsTouchDevice,
} from '../useMediaQuery'

describe('useMediaQuery', () => {
  let matchMediaMock: any

  beforeEach(() => {
    matchMediaMock = vi.fn()
    window.matchMedia = matchMediaMock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns false initially when media query does not match', () => {
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(false)
  })

  it('returns true initially when media query matches', () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(true)
  })

  it('updates when media query changes', () => {
    let listener: any
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn((event, callback) => {
        listener = callback
      }),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(false)

    act(() => {
      listener({ matches: true })
    })

    expect(result.current).toBe(true)
  })

  it('cleans up event listener on unmount', () => {
    const removeEventListener = vi.fn()
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener,
    })

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    unmount()

    expect(removeEventListener).toHaveBeenCalled()
  })
})

describe('useIsMobile', () => {
  it('returns true for mobile viewport', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })
})

describe('useIsTablet', () => {
  it('returns true for tablet viewport', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useIsTablet())
    expect(result.current).toBe(true)
  })
})

describe('useIsDesktop', () => {
  it('returns true for desktop viewport', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useIsDesktop())
    expect(result.current).toBe(true)
  })
})

describe('useIsTouchDevice', () => {
  it('returns true for touch devices', () => {
    Object.defineProperty(window, 'ontouchstart', {
      value: true,
      writable: true,
    })

    const { result } = renderHook(() => useIsTouchDevice())
    expect(result.current).toBe(true)
  })

  it('returns false for non-touch devices', () => {
    // Delete the property to simulate non-touch device
    delete (window as any).ontouchstart
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 0,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useIsTouchDevice())
    expect(result.current).toBe(false)
  })
})
