import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  handleError,
  ApplicationError,
  handleAPIError,
  handleGraphQLError,
  retryWithBackoff,
  isNetworkError,
  isAuthError,
  isPermissionError,
  getUserFriendlyErrorMessage,
} from '../error-handler'

describe('error-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ApplicationError', () => {
    it('creates error with all properties', () => {
      const error = new ApplicationError(
        'Test error',
        'TEST_ERROR',
        400,
        { detail: 'test' }
      )

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error.details).toEqual({ detail: 'test' })
      expect(error.name).toBe('ApplicationError')
    })
  })

  describe('handleError', () => {
    it('handles ApplicationError', () => {
      const error = new ApplicationError('Test error', 'TEST_ERROR', 400)
      const result = handleError(error, 'test context')

      expect(result).toEqual({
        message: 'Test error',
        code: 'TEST_ERROR',
        statusCode: 400,
        details: undefined,
      })
    })

    it('handles standard Error', () => {
      const error = new Error('Standard error')
      const result = handleError(error)

      expect(result).toEqual({
        message: 'Standard error',
        code: 'UNKNOWN_ERROR',
      })
    })

    it('handles string error', () => {
      const result = handleError('String error')

      expect(result).toEqual({
        message: 'String error',
        code: 'UNKNOWN_ERROR',
      })
    })

    it('handles unknown error type', () => {
      const result = handleError({ unknown: 'error' })

      expect(result).toEqual({
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        details: { unknown: 'error' },
      })
    })
  })

  describe('handleAPIError', () => {
    it('handles JSON error response', async () => {
      const response = {
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({
          message: 'Invalid request',
          code: 'INVALID_REQUEST',
          details: { field: 'email' },
        }),
      } as unknown as Response

      await expect(handleAPIError(response)).rejects.toThrow(ApplicationError)
      await expect(handleAPIError(response)).rejects.toMatchObject({
        message: 'Invalid request',
        code: 'INVALID_REQUEST',
        statusCode: 400,
      })
    })

    it('handles non-JSON error response', async () => {
      const response = {
        status: 500,
        statusText: 'Internal Server Error',
        json: vi.fn().mockRejectedValue(new Error('Not JSON')),
      } as unknown as Response

      await expect(handleAPIError(response)).rejects.toThrow(ApplicationError)
      await expect(handleAPIError(response)).rejects.toMatchObject({
        message: 'Internal Server Error',
        code: 'API_ERROR',
        statusCode: 500,
      })
    })
  })

  describe('handleGraphQLError', () => {
    it('handles GraphQL errors', () => {
      const errors = [
        {
          message: 'GraphQL error',
          extensions: { code: 'GRAPHQL_ERROR' },
        },
      ]

      expect(() => handleGraphQLError(errors)).toThrow(ApplicationError)
      expect(() => handleGraphQLError(errors)).toThrow('GraphQL error')
    })

    it('handles GraphQL errors without extensions', () => {
      const errors = [{ message: 'Simple error' }]

      expect(() => handleGraphQLError(errors)).toThrow(ApplicationError)
      expect(() => handleGraphQLError(errors)).toThrow('Simple error')
    })

    it('handles empty error array', () => {
      const errors: unknown[] = []

      expect(() => handleGraphQLError(errors)).toThrow(ApplicationError)
      expect(() => handleGraphQLError(errors)).toThrow('GraphQL request failed')
    })
  })

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('succeeds on first try', async () => {
      const fn = vi.fn().mockResolvedValue('success')

      const result = await retryWithBackoff(fn)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('retries on failure and eventually succeeds', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success')

      const promise = retryWithBackoff(fn, 3, 100)

      // Fast-forward through retries
      await vi.runAllTimersAsync()

      const result = await promise

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('throws after max retries', async () => {
      const error = new Error('Persistent failure')
      const fn = vi.fn().mockRejectedValue(error)

      const promise = retryWithBackoff(fn, 3, 100)

      await vi.runAllTimersAsync()

      await expect(promise).rejects.toThrow('Persistent failure')
      expect(fn).toHaveBeenCalledTimes(3)
    })
  })

  describe('isNetworkError', () => {
    it('identifies network errors', () => {
      expect(isNetworkError(new Error('fetch failed'))).toBe(true)
      expect(isNetworkError(new Error('network error'))).toBe(true)
      expect(isNetworkError(new Error('NetworkError'))).toBe(true)
    })

    it('returns false for non-network errors', () => {
      expect(isNetworkError(new Error('Other error'))).toBe(false)
      expect(isNetworkError('string error')).toBe(false)
    })
  })

  describe('isAuthError', () => {
    it('identifies authentication errors', () => {
      expect(isAuthError(new ApplicationError('Unauthorized', 'UNAUTHORIZED', 401))).toBe(
        true
      )
      expect(isAuthError(new ApplicationError('Auth failed', 'UNAUTHORIZED'))).toBe(true)
    })

    it('returns false for non-auth errors', () => {
      expect(isAuthError(new ApplicationError('Other error', 'OTHER', 400))).toBe(false)
      expect(isAuthError(new Error('Standard error'))).toBe(false)
    })
  })

  describe('isPermissionError', () => {
    it('identifies permission errors', () => {
      expect(isPermissionError(new ApplicationError('Forbidden', 'FORBIDDEN', 403))).toBe(
        true
      )
      expect(isPermissionError(new ApplicationError('No access', 'FORBIDDEN'))).toBe(true)
    })

    it('returns false for non-permission errors', () => {
      expect(isPermissionError(new ApplicationError('Other error', 'OTHER', 400))).toBe(
        false
      )
      expect(isPermissionError(new Error('Standard error'))).toBe(false)
    })
  })

  describe('getUserFriendlyErrorMessage', () => {
    it('returns network error message', () => {
      const message = getUserFriendlyErrorMessage(new Error('fetch failed'))
      expect(message).toContain('internet connection')
    })

    it('returns auth error message', () => {
      const message = getUserFriendlyErrorMessage(
        new ApplicationError('Unauthorized', 'UNAUTHORIZED', 401)
      )
      expect(message).toContain('session has expired')
    })

    it('returns permission error message', () => {
      const message = getUserFriendlyErrorMessage(
        new ApplicationError('Forbidden', 'FORBIDDEN', 403)
      )
      expect(message).toContain('do not have permission')
    })

    it('returns ApplicationError message', () => {
      const message = getUserFriendlyErrorMessage(
        new ApplicationError('Custom error', 'CUSTOM')
      )
      expect(message).toBe('Custom error')
    })

    it('returns standard Error message', () => {
      const message = getUserFriendlyErrorMessage(new Error('Standard error'))
      expect(message).toBe('Standard error')
    })

    it('returns default message for unknown errors', () => {
      const message = getUserFriendlyErrorMessage({ unknown: 'error' })
      expect(message).toContain('unexpected error')
    })
  })
})
