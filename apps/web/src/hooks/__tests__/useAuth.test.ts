import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '../useAuth'
import { getCurrentUser, fetchAuthSession, signOut as amplifySignOut } from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'
import { UserRole } from '@/types/auth'

// Mock AWS Amplify
vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn(),
  fetchAuthSession: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('aws-amplify/utils', () => ({
  Hub: {
    listen: vi.fn(() => vi.fn()),
  },
}))

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with loading state', () => {
    vi.mocked(getCurrentUser).mockImplementation(() => new Promise(() => {}))
    vi.mocked(fetchAuthSession).mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('fetches and sets authenticated user', async () => {
    const mockUser = {
      userId: 'user-123',
      username: 'testuser',
    }

    const mockSession = {
      tokens: {
        idToken: {
          payload: {
            email: 'test@example.com',
            given_name: 'Test',
            family_name: 'User',
            'custom:role': UserRole.BIDDER,
            email_verified: true,
          },
        },
      },
    }

    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)
    vi.mocked(fetchAuthSession).mockResolvedValue(mockSession as any)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toEqual({
      userId: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      givenName: 'Test',
      familyName: 'User',
      role: UserRole.BIDDER,
      permissions: expect.any(Object),
      emailVerified: true,
      mfaEnabled: false,
    })
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('handles authentication error', async () => {
    const error = new Error('Authentication failed')
    vi.mocked(getCurrentUser).mockRejectedValue(error)
    vi.mocked(fetchAuthSession).mockRejectedValue(error)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.error).toBe('Authentication failed')
  })

  it('handles missing session tokens', async () => {
    const mockUser = {
      userId: 'user-123',
      username: 'testuser',
    }

    const mockSession = {
      tokens: null,
    }

    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)
    vi.mocked(fetchAuthSession).mockResolvedValue(mockSession as any)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('signs out user successfully', async () => {
    const mockUser = {
      userId: 'user-123',
      username: 'testuser',
    }

    const mockSession = {
      tokens: {
        idToken: {
          payload: {
            email: 'test@example.com',
            given_name: 'Test',
            family_name: 'User',
            'custom:role': UserRole.BIDDER,
            email_verified: true,
          },
        },
      },
    }

    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)
    vi.mocked(fetchAuthSession).mockResolvedValue(mockSession as any)
    vi.mocked(amplifySignOut).mockResolvedValue(undefined as any)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    await result.current.signOut()

    expect(amplifySignOut).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/auth')
  })

  it('handles sign out error', async () => {
    const mockUser = {
      userId: 'user-123',
      username: 'testuser',
    }

    const mockSession = {
      tokens: {
        idToken: {
          payload: {
            email: 'test@example.com',
            given_name: 'Test',
            family_name: 'User',
            'custom:role': UserRole.BIDDER,
            email_verified: true,
          },
        },
      },
    }

    const signOutError = new Error('Sign out failed')
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)
    vi.mocked(fetchAuthSession).mockResolvedValue(mockSession as any)
    vi.mocked(amplifySignOut).mockRejectedValue(signOutError)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    await result.current.signOut()

    expect(result.current.error).toBe('Sign out failed')
  })

  it('refreshes user data', async () => {
    const mockUser = {
      userId: 'user-123',
      username: 'testuser',
    }

    const mockSession = {
      tokens: {
        idToken: {
          payload: {
            email: 'test@example.com',
            given_name: 'Test',
            family_name: 'User',
            'custom:role': UserRole.BIDDER,
            email_verified: true,
          },
        },
      },
    }

    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)
    vi.mocked(fetchAuthSession).mockResolvedValue(mockSession as any)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    // Update mock to return different data
    const updatedSession = {
      tokens: {
        idToken: {
          payload: {
            ...mockSession.tokens.idToken.payload,
            given_name: 'Updated',
          },
        },
      },
    }
    vi.mocked(fetchAuthSession).mockResolvedValue(updatedSession as any)

    await result.current.refreshUser()

    await waitFor(() => {
      expect(result.current.user?.givenName).toBe('Updated')
    })
  })

  it('defaults to BIDDER role when role is not specified', async () => {
    const mockUser = {
      userId: 'user-123',
      username: 'testuser',
    }

    const mockSession = {
      tokens: {
        idToken: {
          payload: {
            email: 'test@example.com',
            given_name: 'Test',
            family_name: 'User',
            email_verified: true,
            // No custom:role specified
          },
        },
      },
    }

    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)
    vi.mocked(fetchAuthSession).mockResolvedValue(mockSession as any)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user?.role).toBe(UserRole.BIDDER)
  })
})
