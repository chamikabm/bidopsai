import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  hasAllRoles,
  getUserPermissions,
  canAccessRoute,
  filterMenuItems,
  MenuItem,
} from '../permissions'
import { UserRole } from '@/types/auth'

describe('permissions', () => {
  describe('hasPermission', () => {
    it('returns true for admin with any permission', () => {
      expect(hasPermission([UserRole.ADMIN], 'canManageUsers')).toBe(true)
      expect(hasPermission([UserRole.ADMIN], 'canAccessFullWorkflow')).toBe(true)
    })

    it('returns true for bidder with workflow permission', () => {
      expect(hasPermission([UserRole.BIDDER], 'canAccessFullWorkflow')).toBe(true)
    })

    it('returns false for drafter with submission permission', () => {
      expect(hasPermission([UserRole.DRAFTER], 'canAccessSubmission')).toBe(false)
    })

    it('returns true for KB-Admin with KB management permission', () => {
      expect(hasPermission([UserRole.KB_ADMIN], 'canManageGlobalKB')).toBe(true)
    })

    it('returns false for KB-View with KB management permission', () => {
      expect(hasPermission([UserRole.KB_VIEW], 'canManageGlobalKB')).toBe(false)
    })

    it('aggregates permissions from multiple roles', () => {
      expect(hasPermission([UserRole.BIDDER, UserRole.KB_ADMIN], 'canManageGlobalKB')).toBe(true)
    })
  })

  describe('hasAnyPermission', () => {
    it('returns true if user has at least one permission', () => {
      expect(
        hasAnyPermission([UserRole.BIDDER], ['canAccessFullWorkflow', 'canManageUsers'])
      ).toBe(true)
    })

    it('returns false if user has none of the permissions', () => {
      expect(
        hasAnyPermission([UserRole.KB_VIEW], ['canManageUsers', 'canManageSettings'])
      ).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('returns true if user has all permissions', () => {
      expect(
        hasAllPermissions([UserRole.ADMIN], ['canManageUsers', 'canManageSettings'])
      ).toBe(true)
    })

    it('returns false if user is missing any permission', () => {
      expect(
        hasAllPermissions([UserRole.BIDDER], ['canAccessFullWorkflow', 'canManageUsers'])
      ).toBe(false)
    })
  })

  describe('hasRole', () => {
    it('returns true if user has the role', () => {
      expect(hasRole([UserRole.ADMIN], UserRole.ADMIN)).toBe(true)
    })

    it('returns false if user does not have the role', () => {
      expect(hasRole([UserRole.BIDDER], UserRole.ADMIN)).toBe(false)
    })
  })

  describe('hasAnyRole', () => {
    it('returns true if user has at least one role', () => {
      expect(hasAnyRole([UserRole.BIDDER], [UserRole.ADMIN, UserRole.BIDDER])).toBe(true)
    })

    it('returns false if user has none of the roles', () => {
      expect(hasAnyRole([UserRole.KB_VIEW], [UserRole.ADMIN, UserRole.BIDDER])).toBe(false)
    })
  })

  describe('hasAllRoles', () => {
    it('returns true if user has all roles', () => {
      expect(hasAllRoles([UserRole.ADMIN, UserRole.BIDDER], [UserRole.ADMIN, UserRole.BIDDER])).toBe(true)
    })

    it('returns false if user is missing any role', () => {
      expect(hasAllRoles([UserRole.BIDDER], [UserRole.ADMIN, UserRole.BIDDER])).toBe(false)
    })
  })

  describe('getUserPermissions', () => {
    it('returns all permissions for admin', () => {
      const permissions = getUserPermissions([UserRole.ADMIN])
      expect(permissions.canManageUsers).toBe(true)
      expect(permissions.canAccessFullWorkflow).toBe(true)
      expect(permissions.canManageSettings).toBe(true)
    })

    it('returns limited permissions for KB-View', () => {
      const permissions = getUserPermissions([UserRole.KB_VIEW])
      expect(permissions.canViewKB).toBe(true)
      expect(permissions.canManageGlobalKB).toBeUndefined()
      expect(permissions.canManageUsers).toBeUndefined()
    })

    it('aggregates permissions from multiple roles', () => {
      const permissions = getUserPermissions([UserRole.BIDDER, UserRole.KB_ADMIN])
      expect(permissions.canAccessFullWorkflow).toBe(true)
      expect(permissions.canManageGlobalKB).toBe(true)
    })
  })

  describe('canAccessRoute', () => {
    it('allows access to dashboard for all users', () => {
      expect(canAccessRoute([UserRole.KB_VIEW], '/dashboard')).toBe(true)
    })

    it('allows access to projects for users with workflow permission', () => {
      expect(canAccessRoute([UserRole.BIDDER], '/projects')).toBe(true)
      expect(canAccessRoute([UserRole.ADMIN], '/projects')).toBe(true)
    })

    it('denies access to users page for non-admin users', () => {
      expect(canAccessRoute([UserRole.BIDDER], '/users')).toBe(false)
      expect(canAccessRoute([UserRole.ADMIN], '/users')).toBe(true)
    })

    it('allows access to knowledge bases for users with KB permissions', () => {
      expect(canAccessRoute([UserRole.KB_VIEW], '/knowledge-bases')).toBe(true)
      expect(canAccessRoute([UserRole.KB_ADMIN], '/knowledge-bases')).toBe(true)
    })

    it('denies access to KB creation for KB-View users', () => {
      expect(canAccessRoute([UserRole.KB_VIEW], '/knowledge-bases/new')).toBe(false)
      expect(canAccessRoute([UserRole.KB_ADMIN], '/knowledge-bases/new')).toBe(true)
    })
  })

  describe('filterMenuItems', () => {
    const menuItems: MenuItem[] = [
      {
        label: 'Dashboard',
        href: '/dashboard',
      },
      {
        label: 'Projects',
        href: '/projects',
        requiredPermissions: ['canAccessFullWorkflow'],
      },
      {
        label: 'Users',
        href: '/users',
        requiredRoles: [UserRole.ADMIN],
      },
      {
        label: 'Knowledge Bases',
        href: '/knowledge-bases',
        requiredPermissions: ['canViewKB'],
        children: [
          {
            label: 'View All',
            href: '/knowledge-bases',
          },
          {
            label: 'Create New',
            href: '/knowledge-bases/new',
            requiredPermissions: ['canManageGlobalKB', 'canManageLocalKB'],
          },
        ],
      },
    ]

    it('shows all items for admin', () => {
      const filtered = filterMenuItems(menuItems, [UserRole.ADMIN])
      expect(filtered).toHaveLength(4)
    })

    it('filters out items without required permissions', () => {
      const filtered = filterMenuItems(menuItems, [UserRole.KB_VIEW])
      expect(filtered).toHaveLength(2) // Dashboard and Knowledge Bases
      expect(filtered.find((item) => item.label === 'Projects')).toBeUndefined()
      expect(filtered.find((item) => item.label === 'Users')).toBeUndefined()
    })

    it('filters out items without required roles', () => {
      const filtered = filterMenuItems(menuItems, [UserRole.BIDDER])
      expect(filtered.find((item) => item.label === 'Users')).toBeUndefined()
    })

    it('filters children recursively', () => {
      const filtered = filterMenuItems(menuItems, [UserRole.KB_VIEW])
      const kbItem = filtered.find((item) => item.label === 'Knowledge Bases')
      expect(kbItem?.children).toHaveLength(1) // Only "View All", not "Create New"
    })
  })
})
