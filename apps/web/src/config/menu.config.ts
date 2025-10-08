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
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: FolderKanban,
    items: [
      {
        id: 'projects-all',
        label: 'All Projects',
        href: '/projects/all',
      },
      {
        id: 'projects-new',
        label: 'New Project',
        href: '/projects/new',
      },
    ],
  },
  {
    id: 'knowledge-bases',
    label: 'Knowledge Bases',
    icon: Database,
    items: [
      {
        id: 'knowledge-bases-all',
        label: 'All Knowledge Bases',
        href: '/knowledge-bases/all',
      },
      {
        id: 'knowledge-bases-new',
        label: 'New Knowledge Base',
        href: '/knowledge-bases/new',
      },
    ],
  },
  {
    id: 'users',
    label: 'User Management',
    href: '/users',
    icon: Users,
    roles: [UserRole.ADMIN], // Only admins can see user management
  },
];

export const SETTINGS_MENU_ITEMS: MenuItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    items: [
      {
        id: 'settings-agents',
        label: 'Agent Configuration',
        href: '/settings/agents',
        icon: Sparkles,
      },
      {
        id: 'settings-integrations',
        label: 'Integrations',
        href: '/settings/integrations',
        icon: Plug,
      },
      {
        id: 'settings-system',
        label: 'System Settings',
        href: '/settings/system',
        icon: SlidersHorizontal,
      },
    ],
  },
];