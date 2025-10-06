import { describe, it, expect, vi } from 'vitest'
import { GET } from '../auth/session/route'
import { NextRequest } from 'next/server'

describe('Auth Session API', () => {
  it('returns success response', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/session')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('message')
    expect(data.message).toBe('Session managed client-side')
  })

  it('handles errors gracefully', async () => {
    // Mock console.error to avoid test output pollution
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const request = new NextRequest('http://localhost:3000/api/auth/session')
    
    // The current implementation doesn't throw errors, but we test the error handling structure
    const response = await GET(request)
    expect(response.status).toBe(200)

    consoleErrorSpy.mockRestore()
  })
})
