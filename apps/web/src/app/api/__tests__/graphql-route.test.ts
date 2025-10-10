import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as graphqlPost, OPTIONS as graphqlOptions } from '../graphql/route'

// Mock fetch
global.fetch = vi.fn()

describe('GraphQL API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /api/graphql', () => {
    it('returns 401 when authorization header is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/graphql', {
        method: 'POST',
        body: JSON.stringify({ query: '{ test }' }),
      })

      const response = await graphqlPost(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('forwards request to GraphQL backend with auth header', async () => {
      const mockGraphQLResponse = {
        data: { user: { id: '1', name: 'Test User' } },
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGraphQLResponse,
      })

      const request = new NextRequest('http://localhost:3000/api/graphql', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: '{ user { id name } }' }),
      })

      const response = await graphqlPost(request)
      const data = await response.json()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        })
      )

      expect(response.status).toBe(200)
      expect(data).toEqual(mockGraphQLResponse)
    })

    it('handles GraphQL errors', async () => {
      const mockErrorResponse = {
        errors: [
          {
            message: 'Field not found',
            extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
          },
        ],
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockErrorResponse,
      })

      const request = new NextRequest('http://localhost:3000/api/graphql', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({ query: '{ invalidField }' }),
      })

      const response = await graphqlPost(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.errors).toEqual(mockErrorResponse.errors)
    })

    it('handles network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const request = new NextRequest('http://localhost:3000/api/graphql', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({ query: '{ test }' }),
      })

      const response = await graphqlPost(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
      expect(data.message).toBe('Network error')
    })

    it('handles backend error responses', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Backend error' }),
      })

      const request = new NextRequest('http://localhost:3000/api/graphql', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({ query: '{ test }' }),
      })

      const response = await graphqlPost(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
    })

    it('handles malformed request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/graphql', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
        },
        body: 'invalid json',
      })

      const response = await graphqlPost(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
    })
  })

  describe('OPTIONS /api/graphql', () => {
    it('returns CORS headers for preflight requests', async () => {
      const response = await graphqlOptions()

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
        'Content-Type, Authorization'
      )
    })
  })
})
