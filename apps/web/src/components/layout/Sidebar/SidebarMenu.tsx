'use client';

import {
  LayoutDashboard,
  FolderKanban,
  Database,
  Users,
  Settings,
} from 'lucide-react';
import { SidebarMenuItem, type MenuItem } from './SidebarMenuItem';
import { useAuth } from '@/hooks/useAuth';

const allMenuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: FolderKanban,
    requiredPermissions: ['canAccessFullWorkflow'],
  },
  {
    label: 'Knowledge Bases',
    href: '/knowledge-bases',
    icon: Database,
    requiredPermissions: ['canViewKB'],
  },
  {
    label: 'Users',
    href: '/users',
    icon: Users,
    requiredPermissions: ['canManageUsers'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    requiredPermissions: ['canManageSettings'],
  },
];

interface SidebarMenuProps {
  collapsed: boolean;
}

export function SidebarMenu({ collapsed }: SidebarMenuProps) {
  const { user } = useAuth();

  // Filter menu items based on user permissions
  const filteredMenuItems = allMenuItems.filter((item) => {
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
      return true;
    }

    if (!user) {
      return false;
    }

    // Check if user has at least one of the required permissions
    return item.requiredPermissions.some((permission) => {
      const permKey = permission as keyof typeof user.permissions;
      return user.permissions[permKey] === true;
    });
  });

  return (
    <nav className="space-y-1">
      {filteredMenuItems.map((item) => (
        <SidebarMenuItem key={item.href} item={item} collapsed={collapsed} />
      ))}
    </nav>
  );
}
