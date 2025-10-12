/**
 * Sidebar Menu Component
 *
 * Main menu with role-based filtering
 */

'use client';

import { useEffect, useState } from 'react';
import { SidebarMenuItem } from './SidebarMenuItem';
import { MenuItem } from '@/types/menu.types';
import { usePermissions } from '@/hooks/usePermissions';

interface SidebarMenuProps {
  items: MenuItem[];
  collapsed?: boolean;
}

export function SidebarMenu({ items, collapsed = false }: SidebarMenuProps) {
  const { roles, isLoading } = usePermissions();
  const [isMounted, setIsMounted] = useState(false);
  
  // Avoid hydration mismatch by only rendering loading state after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
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
  
  // During SSR or initial mount, show all items without role filtering
  // This prevents hydration mismatch
  if (!isMounted) {
    return (
      <nav className="space-y-1">
        {items.map((item) => (
          <SidebarMenuItem key={item.id} item={item} collapsed={collapsed} />
        ))}
      </nav>
    );
  }
  
  // After mount, show loading or filtered items
  const filteredItems = isLoading ? items : filterMenuItems(items);
  
  return (
    <nav className="space-y-1">
      {filteredItems.map((item) => (
        <SidebarMenuItem key={item.id} item={item} collapsed={collapsed} />
      ))}
    </nav>
  );
}