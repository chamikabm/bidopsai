import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePermissions } from '../usePermissions'
import { useAuth } from '../useAuth'
import { UserRole } from '@/types/auth'

// Mock useAuth hook
vi.mock('../useAuth')

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty permissions when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      signOut: vi.fn(),
      refreshUser: vi.fn(),
    })

    const { result } = renderHook(() => usePermissions())
    
    expect(result.current.permissions.canAccessFullWorkflow).toBe(false)
    expect(result.current.permissions.canManageUsers).toBe(false)
  })

  it('returns admin permissions for admin user', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        userId: '1',
        username: 'admin',
        email: 'admin@test.com',
        givenName: 'Admin',
        familyName: 'User',
        role: UserRole.ADMIN,
        permissions: {
          canAccessFullWorkflow: true,
          canManageUsers: true,
          canManageGlobalKB: true,
          canManageLocalKB: true,
          canViewKB: true,
          canAccessComms: true,
          canAccessSubmission: true,
          canManageSettings: true,
        },
        emailVerified: true,
        mfaEnabled: false,
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      signOut: vi.fn(),
      refreshUser: vi.fn(),
    })

    const { result } = renderHook(() => usePermissions())
    
    expect(result.current.permissions.canManageUsers).toBe(true)
    expect(result.current.permissions.canAccessFullWorkflow).toBe(true)
    expect(result.current.permissions.canManageSettings).toBe(true)
  })

  it('returns limited permissions for KB-View user', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        userId: '1',
        username: 'viewer',
        email: 'viewer@test.com',
        givenName: 'View',
        familyName: 'User',
        role: UserRole.KB_VIEW,
        permissions: {
          canAccessFullWorkflow: false,
          canManageUsers: false,
          canManageGlobalKB: false,
          canManageLocalKB: false,
          canViewKB: true,
          canAccessComms: false,
          canAccessSubmission: false,
          canManageSettings: false,
        },
        emailVerified: true,
        mfaEnabled: false,
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      signOut: vi.fn(),
      refreshUser: vi.fn(),
    })

    const { result } = renderHook(() => usePermissions())
    
    expect(result.current.permissions.canViewKB).toBe(true)
    expect(result.current.permissions.canManageUsers).toBe(false)
    expect(result.current.permissions.canManageGlobalKB).toBe(false)
  })

  describe('hasPermission', () => {
    it('returns true when user has permission', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          userId: '1',
          username: 'bidder',
          email: 'bidder@test.com',
          givenName: 'Bidder',
          familyName: 'User',
          role: UserRole.BIDDER,
          permissions: {
            canAccessFullWorkflow: true,
            canManageUsers: false,
            canManageGlobalKB: false,
            canManageLocalKB: true,
            canViewKB: true,
            canAccessComms: true,
            canAccessSubmission: true,
            canManageSettings: false,
          },
          emailVerified: true,
          mfaEnabled: false,
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        signOut: vi.fn(),
        refreshUser: vi.fn(),
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(result.current.hasPermission('canAccessFullWorkflow')).toBe(true)
    })

    it('returns false when user lacks permission', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          userId: '1',
          username: 'bidder',
          email: 'bidder@test.com',
          givenName: 'Bidder',
          familyName: 'User',
          role: UserRole.BIDDER,
          permissions: {
            canAccessFullWorkflow: true,
            canManageUsers: false,
            canManageGlobalKB: false,
            canManageLocalKB: true,
            canViewKB: true,
            canAccessComms: true,
            canAccessSubmission: true,
            canManageSettings: false,
          },
          emailVerified: true,
          mfaEnabled: false,
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        signOut: vi.fn(),
        refreshUser: vi.fn(),
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(result.current.hasPermission('canManageUsers')).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('returns true when user has at least one permission', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          userId: '1',
          username: 'bidder',
          email: 'bidder@test.com',
          givenName: 'Bidder',
          familyName: 'User',
          role: UserRole.BIDDER,
          permissions: {
            canAccessFullWorkflow: true,
            canManageUsers: false,
            canManageGlobalKB: false,
            canManageLocalKB: true,
            canViewKB: true,
            canAccessComms: true,
            canAccessSubmission: true,
            canManageSettings: false,
          },
          emailVerified: true,
          mfaEnabled: false,
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        signOut: vi.fn(),
        refreshUser: vi.fn(),
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(
        result.current.hasAnyPermission(['canAccessFullWorkflow', 'canManageUsers'])
      ).toBe(true)
    })

    it('returns false when user has none of the permissions', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          userId: '1',
          username: 'viewer',
          email: 'viewer@test.com',
          givenName: 'View',
          familyName: 'User',
          role: UserRole.KB_VIEW,
          permissions: {
            canAccessFullWorkflow: false,
            canManageUsers: false,
            canManageGlobalKB: false,
            canManageLocalKB: false,
            canViewKB: true,
            canAccessComms: false,
            canAccessSubmission: false,
            canManageSettings: false,
          },
          emailVerified: true,
          mfaEnabled: false,
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        signOut: vi.fn(),
        refreshUser: vi.fn(),
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(
        result.current.hasAnyPermission(['canManageUsers', 'canManageSettings'])
      ).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('returns true when user has all permissions', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          userId: '1',
          username: 'admin',
          email: 'admin@test.com',
          givenName: 'Admin',
          familyName: 'User',
          role: UserRole.ADMIN,
          permissions: {
            canAccessFullWorkflow: true,
            canManageUsers: true,
            canManageGlobalKB: true,
            canManageLocalKB: true,
            canViewKB: true,
            canAccessComms: true,
            canAccessSubmission: true,
            canManageSettings: true,
          },
          emailVerified: true,
          mfaEnabled: false,
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        signOut: vi.fn(),
        refreshUser: vi.fn(),
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(
        result.current.hasAllPermissions(['canManageUsers', 'canManageSettings'])
      ).toBe(true)
    })

    it('returns false when user is missing any permission', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          userId: '1',
          username: 'bidder',
          email: 'bidder@test.com',
          givenName: 'Bidder',
          familyName: 'User',
          role: UserRole.BIDDER,
          permissions: {
            canAccessFullWorkflow: true,
            canManageUsers: false,
            canManageGlobalKB: false,
            canManageLocalKB: true,
            canViewKB: true,
            canAccessComms: true,
            canAccessSubmission: true,
            canManageSettings: false,
          },
          emailVerified: true,
          mfaEnabled: false,
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        signOut: vi.fn(),
        refreshUser: vi.fn(),
      })

      const { result } = renderHook(() => usePermissions())
      
      expect(
        result.current.hasAllPermissions(['canAccessFullWorkflow', 'canManageUsers'])
      ).toBe(false)
    })
  })
})
