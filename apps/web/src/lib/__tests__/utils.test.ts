import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cn,
  formatBytes,
  formatDate,
  formatDateTime,
  generateId,
  debounce,
  throttle,
} from '../utils'

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('handles conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('merges tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })

    it('handles undefined and null', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
    })
  })

  describe('formatBytes', () => {
    it('formats 0 bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes')
    })

    it('formats bytes correctly', () => {
      expect(formatBytes(500)).toBe('500 Bytes')
    })

    it('formats kilobytes correctly', () => {
      expect(formatBytes(1024)).toBe('1 KB')
    })

    it('formats megabytes correctly', () => {
      expect(formatBytes(1048576)).toBe('1 MB')
    })

    it('formats gigabytes correctly', () => {
      expect(formatBytes(1073741824)).toBe('1 GB')
    })

    it('respects decimal places', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB')
      expect(formatBytes(1536, 1)).toBe('1.5 KB')
      expect(formatBytes(1536, 2)).toBe('1.5 KB')
    })
  })

  describe('formatDate', () => {
    it('formats Date object correctly', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/January 15, 2024/)
    })

    it('formats string date correctly', () => {
      const formatted = formatDate('2024-01-15')
      expect(formatted).toMatch(/January 15, 2024/)
    })

    it('formats timestamp correctly', () => {
      const timestamp = new Date('2024-01-15').getTime()
      const formatted = formatDate(timestamp)
      expect(formatted).toMatch(/January 15, 2024/)
    })
  })

  describe('formatDateTime', () => {
    it('formats Date object with time', () => {
      const date = new Date('2024-01-15T14:30:00')
      const formatted = formatDateTime(date)
      expect(formatted).toMatch(/Jan 15, 2024/)
      expect(formatted).toMatch(/2:30 PM|14:30/)
    })

    it('formats string date with time', () => {
      const formatted = formatDateTime('2024-01-15T14:30:00')
      expect(formatted).toMatch(/Jan 15, 2024/)
    })
  })

  describe('generateId', () => {
    it('generates a string', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
    })

    it('generates unique ids', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('generates ids of reasonable length', () => {
      const id = generateId()
      expect(id.length).toBeGreaterThan(10)
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('delays function execution', () => {
      const func = vi.fn()
      const debouncedFunc = debounce(func, 100)

      debouncedFunc()
      expect(func).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(func).toHaveBeenCalledTimes(1)
    })

    it('cancels previous calls', () => {
      const func = vi.fn()
      const debouncedFunc = debounce(func, 100)

      debouncedFunc()
      debouncedFunc()
      debouncedFunc()

      vi.advanceTimersByTime(100)
      expect(func).toHaveBeenCalledTimes(1)
    })

    it('passes arguments correctly', () => {
      const func = vi.fn()
      const debouncedFunc = debounce(func, 100)

      debouncedFunc('arg1', 'arg2')
      vi.advanceTimersByTime(100)

      expect(func).toHaveBeenCalledWith('arg1', 'arg2')
    })
  })

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('executes function immediately on first call', () => {
      const func = vi.fn()
      const throttledFunc = throttle(func, 100)

      throttledFunc()
      expect(func).toHaveBeenCalledTimes(1)
    })

    it('prevents execution within throttle period', () => {
      const func = vi.fn()
      const throttledFunc = throttle(func, 100)

      throttledFunc()
      throttledFunc()
      throttledFunc()

      expect(func).toHaveBeenCalledTimes(1)
    })

    it('allows execution after throttle period', () => {
      const func = vi.fn()
      const throttledFunc = throttle(func, 100)

      throttledFunc()
      expect(func).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(100)
      throttledFunc()
      expect(func).toHaveBeenCalledTimes(2)
    })

    it('passes arguments correctly', () => {
      const func = vi.fn()
      const throttledFunc = throttle(func, 100)

      throttledFunc('arg1', 'arg2')
      expect(func).toHaveBeenCalledWith('arg1', 'arg2')
    })
  })
})
