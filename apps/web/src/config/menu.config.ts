/**
 * Menu Configuration
 *
 * Defines the sidebar menu structure with role-based permissions
 */

import {
  LayoutDashboard,
  FolderKanban,
  Database,
  Users,
  Settings,
  Sparkles,
  Plug,
  SlidersHorizontal,
} from 'lucide-react';
import { MenuItem } from '@/types/menu.types';
import { UserRole } from '@/types/user.types';

export const MAIN_MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    // All roles can access dashboard
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: FolderKanban,
    // All roles can access projects (at least read)
    items: [
      {
        id: 'projects-all',
        label: 'All Projects',
        href: '/projects/all',
        // All roles can view projects
      },
      {
        id: 'projects-new',
        label: 'New Project',
        href: '/projects/new',
        // Only Admin, Drafter, Bidder can create projects
        roles: [UserRole.ADMIN, UserRole.DRAFTER, UserRole.BIDDER],
      },
    ],
  },
  {
    id: 'knowledge-bases',
    label: 'Knowledge Bases',
    icon: Database,
    // All roles can access knowledge bases (at least read)
    items: [
      {
        id: 'knowledge-bases-all',
        label: 'All Knowledge Bases',
        href: '/knowledge-bases/all',
        // All roles can view knowledge bases
      },
      {
        id: 'knowledge-bases-new',
        label: 'New Knowledge Base',
        href: '/knowledge-bases/new',
        // Only Admin, Bidder, KB_ADMIN can create knowledge bases
        roles: [UserRole.ADMIN, UserRole.BIDDER, UserRole.KB_ADMIN],
      },
    ],
  },
  {
    id: 'users',
    label: 'User Management',
    icon: Users,
    // Only Admin, Drafter, Bidder can access users (Admin has full access, others read-only)
    roles: [UserRole.ADMIN, UserRole.DRAFTER, UserRole.BIDDER],
    items: [
      {
        id: 'users-all',
        label: 'All Users',
        href: '/users/all',
        // Admin, Drafter, Bidder can view users
      },
      {
        id: 'users-new',
        label: 'New User',
        href: '/users/new',
        // Only Admin can create users
        roles: [UserRole.ADMIN],
      },
    ],
  },
];

export const SETTINGS_MENU_ITEMS: MenuItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    // Only Admin, Drafter, Bidder can access settings (Admin has full access, others read-only)
    roles: [UserRole.ADMIN, UserRole.DRAFTER, UserRole.BIDDER],
    items: [
      {
        id: 'settings-agents',
        label: 'Agent Configuration',
        href: '/settings/agents',
        icon: Sparkles,
        // Only Admin can configure agents
        roles: [UserRole.ADMIN],
      },
      {
        id: 'settings-integrations',
        label: 'Integrations',
        href: '/settings/integrations',
        icon: Plug,
        // Only Admin can manage integrations
        roles: [UserRole.ADMIN],
      },
      {
        id: 'settings-system',
        label: 'System Settings',
        href: '/settings/system',
        icon: SlidersHorizontal,
        // Admin, Drafter, Bidder can view system settings (Admin can edit)
        roles: [UserRole.ADMIN, UserRole.DRAFTER, UserRole.BIDDER],
      },
    ],
  },
];