/**
 * Sidebar Menu Component
 * 
 * Main menu with role-based filtering
 */

'use client';

import { SidebarMenuItem } from './SidebarMenuItem';
import { MenuItem } from '@/types/menu.types';
import { usePermissions } from '@/hooks/usePermissions';

interface SidebarMenuProps {
  items: MenuItem[];
  collapsed?: boolean;
}

export function SidebarMenu({ items, collapsed = false }: SidebarMenuProps) {
  const { roles } = usePermissions();
  
  // Filter menu items based on user roles
  const filterMenuItems = (menuItems: MenuItem[]): MenuItem[] => {
    return menuItems.filter(item => {
      // If no roles are specified, show to everyone
      if (!item.roles || item.roles.length === 0) {
        return true;
      }
      
      // Check if user has any of the required roles
      return item.roles.some(role => roles.includes(role));
    }).map(item => {
      // Recursively filter sub-items
      if (item.items && item.items.length > 0) {
        return {
          ...item,
          items: filterMenuItems(item.items),
        };
      }
      return item;
    });
  };
  
  const filteredItems = filterMenuItems(items);
  
  return (
    <nav className="space-y-1">
      {filteredItems.map((item) => (
        <SidebarMenuItem key={item.id} item={item} collapsed={collapsed} />
      ))}
    </nav>
  );
}